
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  type?: 'follow_up' | 'pre_call_reminder' | 'admin_notification';
  sequenceType?: 'follow_up' | 'pre_call_reminder' | 'admin_notification'; // Alternative parameter name
  userEmail?: string;
  email?: string; // Alternative parameter name
  userName?: string;
  name?: string; // Alternative parameter name
  callDate?: string;
  callTime?: string;
  userPhone?: string;
  templateId?: string;
  variables?: any;
  userData?: any; // Alternative parameter name
}

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    console.log('Received email sequence request:', JSON.stringify(requestBody, null, 2));

    // Normalize parameters to handle different parameter names
    const normalizedRequest: EmailRequest = {
      type: requestBody.type || requestBody.sequenceType,
      userEmail: requestBody.userEmail || requestBody.email,
      userName: requestBody.userName || requestBody.name,
      callDate: requestBody.callDate,
      callTime: requestBody.callTime,
      userPhone: requestBody.userPhone,
      templateId: requestBody.templateId,
      variables: requestBody.variables || requestBody.userData || {},
    };

    const { type, userEmail, userName, callDate, callTime, userPhone, templateId, variables } = normalizedRequest;

    console.log('Normalized request:', JSON.stringify(normalizedRequest, null, 2));

    // Validate required parameters
    if (!type) {
      console.error('Missing required parameter: type/sequenceType');
      throw new Error('Missing required parameter: type or sequenceType');
    }

    if (!userEmail) {
      console.error('Missing required parameter: userEmail/email');
      throw new Error('Missing required parameter: userEmail or email');
    }

    if (!userName) {
      console.error('Missing required parameter: userName/name');
      throw new Error('Missing required parameter: userName or name');
    }

    console.log(`Processing email sequence for ${userEmail}, type: ${type}`);

    // Handle direct template sending (for admin notifications)
    if (templateId) {
      console.log(`Sending direct template ${templateId} to ${userEmail}`);
      
      const { data: template, error: templateError } = await supabase
        .from('email_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (templateError || !template) {
        console.error('Template error:', templateError);
        throw new Error(`Template not found: ${templateId}`);
      }

      // Create a minimal enrollment record for tracking
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('email_enrollments')
        .insert({
          sequence_id: template.sequence_id,
          user_email: userEmail,
          user_name: userName,
          enrollment_data: variables || {},
          status: 'completed'
        })
        .select()
        .single();

      if (enrollmentError) {
        console.error('Failed to create enrollment record, continuing with email send:', enrollmentError);
      }

      // Send the email immediately
      await sendEmail(enrollment?.id || 'direct', template, userEmail, userName, variables || {});

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Direct template email sent successfully',
          templateId
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Regular sequence enrollment logic
    console.log(`Looking for sequence with type: ${type}`);
    
    const { data: sequence, error: sequenceError } = await supabase
      .from('email_sequences')
      .select('*')
      .eq('sequence_type', type)
      .eq('is_active', true)
      .single();

    if (sequenceError || !sequence) {
      console.error('Sequence error:', sequenceError);
      throw new Error(`No active sequence found for type: ${type}`);
    }

    console.log(`Found sequence:`, sequence);

    // Get templates for this sequence
    const { data: templates, error: templatesError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('sequence_id', sequence.id)
      .eq('is_active', true)
      .order('email_order');

    if (templatesError || !templates?.length) {
      console.error('Templates error:', templatesError);
      throw new Error('No active templates found for sequence');
    }

    console.log(`Found ${templates.length} templates for sequence`);

    // Create enrollment record
    const enrollmentData = {
      sequence_id: sequence.id,
      user_email: userEmail,
      user_name: userName,
      enrollment_data: { callDate, callTime, userPhone, ...variables },
      status: 'active'
    };

    console.log('Creating enrollment:', enrollmentData);

    const { data: enrollment, error: enrollmentError } = await supabase
      .from('email_enrollments')
      .insert(enrollmentData)
      .select()
      .single();

    if (enrollmentError) {
      console.error('Enrollment error:', enrollmentError);
      throw new Error(`Failed to create enrollment: ${enrollmentError.message}`);
    }

    console.log(`Created enrollment ${enrollment.id} for ${userEmail}`);

    // Send immediate emails (delay_hours = 0)
    const immediateTemplates = templates.filter(t => t.delay_hours === 0);
    console.log(`Sending ${immediateTemplates.length} immediate emails`);
    
    for (const template of immediateTemplates) {
      console.log(`Sending immediate email with template ${template.id}`);
      await sendEmail(enrollment.id, template, userEmail, userName, { callDate, callTime, userPhone, ...variables });
    }

    // Schedule delayed emails
    const delayedTemplates = templates.filter(t => t.delay_hours !== 0);
    console.log(`Scheduling ${delayedTemplates.length} delayed emails`);
    
    for (const template of delayedTemplates) {
      let scheduledTime: Date;
      
      if (type === 'pre_call_reminder' && callDate && callTime) {
        // For pre-call reminders, calculate based on appointment time
        // Note: delay_hours should be negative for "before appointment" emails
        try {
          const appointmentTime = new Date(`${callDate}T${callTime}:00`);
          if (isNaN(appointmentTime.getTime())) {
            throw new Error(`Invalid appointment time: ${callDate} ${callTime}`);
          }
          scheduledTime = new Date(appointmentTime.getTime() + (template.delay_hours * 60 * 60 * 1000));
        } catch (dateError) {
          console.error('Date parsing error, using current time + delay:', dateError);
          scheduledTime = new Date(Date.now() + (template.delay_hours * 60 * 60 * 1000));
        }
      } else {
        // For follow-up sequence, calculate based on enrollment time
        scheduledTime = new Date(Date.now() + (template.delay_hours * 60 * 60 * 1000));
      }

      console.log(`Scheduling email for ${scheduledTime.toISOString()}`);
      
      // In a real implementation, you'd use a job queue or cron job
      // For now, we'll create a record that can be processed by a scheduled function
      await supabase
        .from('email_sends')
        .insert({
          enrollment_id: enrollment.id,
          template_id: template.id,
          recipient_email: userEmail,
          subject_line: replaceVariables(template.subject_line, userName, { callDate, callTime, userPhone, ...variables }),
          status: 'scheduled',
          sent_at: scheduledTime.toISOString()
        });
    }

    console.log('Email sequence processing completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        enrollmentId: enrollment.id,
        immediateEmailsSent: immediateTemplates.length,
        delayedEmailsScheduled: delayedTemplates.length
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error in send-email-sequence:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
};

async function sendEmail(
  enrollmentId: string, 
  template: any, 
  userEmail: string, 
  userName: string, 
  variables: any
) {
  try {
    console.log(`Sending email to ${userEmail} with template ${template.id}`);
    
    const subject = replaceVariables(template.subject_line, userName, variables);
    const content = replaceVariables(template.email_content, userName, variables);

    console.log(`Email subject: ${subject}`);

    const emailResponse = await resend.emails.send({
      from: "True North Business Loan <noreply@email.truenorthbusinessloan.ca>",
      to: [userEmail],
      subject: subject,
      html: content.replace(/\n/g, '<br>'),
      tags: [
        { name: 'sequence_type', value: variables.sequenceType || 'follow_up' },
        { name: 'template_id', value: template.id }
      ]
    });

    console.log(`Email sent successfully:`, emailResponse);

    // Record the send
    await supabase
      .from('email_sends')
      .insert({
        enrollment_id: enrollmentId,
        template_id: template.id,
        resend_email_id: emailResponse.data?.id,
        recipient_email: userEmail,
        subject_line: subject,
        status: 'sent'
      });

    return emailResponse;
  } catch (error) {
    console.error('Error sending email:', error);
    
    // Record the failed send
    await supabase
      .from('email_sends')
      .insert({
        enrollment_id: enrollmentId,
        template_id: template.id,
        recipient_email: userEmail,
        subject_line: replaceVariables(template.subject_line, userName, variables),
        status: 'failed',
        error_message: error.message
      });
    
    throw error;
  }
}

function replaceVariables(text: string, userName: string, variables: any): string {
  let result = text
    .replace(/\[First Name\]/g, userName)
    .replace(/\[Date\]/g, variables.callDate || '')
    .replace(/\[Time\]/g, variables.callTime || '')
    .replace(/\[Phone Number\]/g, variables.userPhone || '');

  // Handle meeting link replacement - only show if one exists
  if (variables.meetingLink) {
    result = result.replace(/\[Meeting Link\]/g, variables.meetingLink);
  } else {
    // Remove lines that contain meeting link placeholder if no link provided
    result = result.replace(/.*\[Meeting Link\].*\n?/g, '');
    // Also remove any standalone "Meeting Link:" text
    result = result.replace(/Meeting Link:\s*\n/g, '');
    result = result.replace(/Here is the link to join:\s*\n/g, '');
    result = result.replace(/If this is a virtual meeting.*\n?/g, '');
  }

  // Replace booking call placeholder
  result = result.replace(/\[Book Your Call\]/g, 'https://calendly.com/truenorth-business-loan');

  // Handle admin notification variables (using double braces)
  if (variables) {
    Object.keys(variables).forEach(key => {
      const placeholder = `{{${key}}}`;
      result = result.replace(new RegExp(placeholder, 'g'), variables[key] || '');
    });
  }

  return result;
}

serve(handler);
