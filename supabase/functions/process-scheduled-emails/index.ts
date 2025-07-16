import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing scheduled emails...');

    // Get emails that are scheduled and due to be sent
    const now = new Date();
    const { data: scheduledEmails, error: fetchError } = await supabase
      .from('email_sends')
      .select(`
        *,
        email_templates (*),
        email_enrollments (*)
      `)
      .eq('status', 'scheduled')
      .lte('sent_at', now.toISOString());

    if (fetchError) {
      throw new Error(`Failed to fetch scheduled emails: ${fetchError.message}`);
    }

    console.log(`Found ${scheduledEmails?.length || 0} emails to send`);

    let sent = 0;
    let failed = 0;

    for (const emailSend of scheduledEmails || []) {
      try {
        const enrollment = emailSend.email_enrollments;
        const template = emailSend.email_templates;
        
        if (!enrollment || !template) {
          console.error('Missing enrollment or template data');
          continue;
        }

        const variables = enrollment.enrollment_data || {};
        const subject = replaceVariables(emailSend.subject_line, enrollment.user_name, variables);
        const content = replaceVariables(template.email_content, enrollment.user_name, variables);

        const emailResponse = await resend.emails.send({
          from: "True North Business Loan <noreply@email.truenorthbusinessloan.ca>",
          to: [emailSend.recipient_email],
          subject: subject,
          html: content.replace(/\n/g, '<br>')
        });

        // Update the send record
        await supabase
          .from('email_sends')
          .update({
            resend_email_id: emailResponse.data?.id,
            status: 'sent',
            sent_at: now.toISOString()
          })
          .eq('id', emailSend.id);

        console.log(`Email sent to ${emailSend.recipient_email}: ${subject}`);
        sent++;

      } catch (error) {
        console.error(`Failed to send email ${emailSend.id}:`, error);
        
        // Update with error
        await supabase
          .from('email_sends')
          .update({
            status: 'failed',
            error_message: error.message
          })
          .eq('id', emailSend.id);
        
        failed++;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: scheduledEmails?.length || 0,
        sent,
        failed
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error in process-scheduled-emails:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
};

function replaceVariables(text: string, userName: string, variables: any): string {
  return text
    .replace(/\[First Name\]/g, userName)
    .replace(/\[Date\]/g, variables.callDate || '')
    .replace(/\[Time\]/g, variables.callTime || '')
    .replace(/\[Phone Number\]/g, variables.userPhone || '')
    .replace(/\[Book Your Call\]/g, 'https://calendly.com/truenorth-business-loan');
}

serve(handler);