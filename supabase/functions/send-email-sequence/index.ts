import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  type: 'follow_up' | 'pre_call_reminder' | 'admin_notification';
  userEmail: string;
  userName: string;
  callDate?: string;
  callTime?: string;
  userPhone?: string;
  templateId?: string; // For direct template sending (admin notifications)
  variables?: any; // Custom variables for template replacement
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
    const { type, userEmail, userName, callDate, callTime, userPhone, templateId, variables }: EmailRequest = await req.json();

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
        console.error('Failed to create enrollment record, continuing with email send');
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
    const { data: sequence, error: sequenceError } = await supabase
      .from('email_sequences')
      .select('*')
      .eq('sequence_type', type)
      .eq('is_active', true)
      .single();

    if (sequenceError || !sequence) {
      throw new Error(`No active sequence found for type: ${type}`);
    }

    // Get templates for this sequence
    const { data: templates, error: templatesError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('sequence_id', sequence.id)
      .eq('is_active', true)
      .order('email_order');

    if (templatesError || !templates?.length) {
      throw new Error('No active templates found for sequence');
    }

    // Create enrollment record
    const enrollmentData = {
      sequence_id: sequence.id,
      user_email: userEmail,
      user_name: userName,
      enrollment_data: { callDate, callTime, userPhone },
      status: 'active'
    };

    const { data: enrollment, error: enrollmentError } = await supabase
      .from('email_enrollments')
      .insert(enrollmentData)
      .select()
      .single();

    if (enrollmentError) {
      throw new Error(`Failed to create enrollment: ${enrollmentError.message}`);
    }

    console.log(`Created enrollment ${enrollment.id} for ${userEmail}`);

    // Send immediate emails (delay_hours = 0)
    const immediateTemplates = templates.filter(t => t.delay_hours === 0);
    
    for (const template of immediateTemplates) {
      await sendEmail(enrollment.id, template, userEmail, userName, { callDate, callTime, userPhone });
    }

    // Schedule delayed emails
    const delayedTemplates = templates.filter(t => t.delay_hours !== 0);
    
    for (const template of delayedTemplates) {
      let scheduledTime: Date;
      
      if (type === 'pre_call_reminder' && callDate && callTime) {
        // For pre-call reminders, calculate based on appointment time
        const appointmentTime = new Date(`${callDate} ${callTime}`);
        scheduledTime = new Date(appointmentTime.getTime() + (template.delay_hours * 60 * 60 * 1000));
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
          subject_line: replaceVariables(template.subject_line, userName, { callDate, callTime, userPhone }),
          status: 'scheduled',
          sent_at: scheduledTime.toISOString()
        });
    }

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
    const subject = replaceVariables(template.subject_line, userName, variables);
    const content = replaceVariables(template.email_content, userName, variables);

    const emailResponse = await resend.emails.send({
      from: "True North Business Loan <noreply@email.truenorthbusinessloan.ca>",
      to: [userEmail],
      subject: subject,
      html: content.replace(/\n/g, '<br>')
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
    .replace(/\[Phone Number\]/g, variables.userPhone || '')
    .replace(/\[Book Your Call\]/g, 'https://calendly.com/truenorth-business-loan');

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