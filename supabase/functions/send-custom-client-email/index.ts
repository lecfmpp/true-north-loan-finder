import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';
import { Resend } from "npm:resend@2.0.0";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string[];
  subject: string;
  message: string;
  clientName: string;
  companyName: string;
  emailType: string;
}

const getEmailTemplate = (emailType: string, clientName: string, companyName: string, message: string) => {
  const baseTemplate = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .content { background-color: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef; }
          .footer { margin-top: 20px; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; }
          .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>True North Business Loan</h2>
          </div>
          <div class="content">
            <h3>Hello ${clientName},</h3>
            <div>${message.replace(/\n/g, '<br>')}</div>
            ${emailType === 'payment_reminder' ? '<a href="#" class="button">Complete Payment</a>' : ''}
            ${emailType === 'credit_reminder' ? '<a href="#" class="button">Purchase More Leads</a>' : ''}
          </div>
          <div class="footer">
            <p>Best regards,<br>True North Business Loan Team</p>
            <p>Company: ${companyName}</p>
          </div>
        </div>
      </body>
    </html>
  `;
  
  return baseTemplate;
};

const handler = async (req: Request): Promise<Response> => {
  console.log('Custom client email function called');

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, message, clientName, companyName, emailType }: EmailRequest = await req.json();

    console.log('Sending custom email to:', to);
    console.log('Email type:', emailType);

    // Generate HTML template
    const htmlContent = getEmailTemplate(emailType, clientName, companyName, message);

    // Send email using Resend
    const emailResponse = await resend.emails.send({
      from: "True North Business Loan <noreply@truenorthbusinessloan.ca>",
      to: to,
      subject: subject,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);

    // Record the email in the database
    const { error: recordError } = await supabase
      .from('lead_custom_emails')
      .insert({
        lead_id: crypto.randomUUID(), // We'll need to link this properly later
        sent_by: 'system', // This should be the admin user ID
        recipient_emails: to,
        resend_email_id: emailResponse.data?.id,
        delivery_status: 'sent'
      });

    if (recordError) {
      console.error('Error recording email:', recordError);
    }

    return new Response(JSON.stringify({ success: true, emailId: emailResponse.data?.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-custom-client-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);