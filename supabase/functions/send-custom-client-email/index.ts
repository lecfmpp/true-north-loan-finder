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
  paymentLink?: string;
  firstName?: string;
}

// Helper function to replace variables in text
const replaceVariables = (text: string, variables: Record<string, string>): string => {
  let result = text;
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `[${key}]`;
    result = result.replace(new RegExp(placeholder, 'g'), value || '');
  });
  return result;
};

const getEmailTemplate = (emailType: string, firstName: string, companyName: string, message: string, paymentLink?: string) => {
  const variables = {
    'First Name': firstName,
    'Company Name': companyName,
    'Payment Link': paymentLink || '#',
    'Stripe Link': paymentLink || '#'
  };

  const baseTemplate = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>True North Business Loan</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0;
            background-color: #f8f9fa;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            padding: 30px; 
            border-radius: 8px; 
            text-align: center; 
            margin-bottom: 30px; 
          }
          .header h1 { 
            color: white; 
            margin: 0; 
            font-size: 28px; 
            font-weight: bold;
          }
          .content { 
            padding: 20px 0; 
            font-size: 16px;
          }
          .greeting {
            font-size: 18px;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 20px;
          }
          .message-content {
            margin: 20px 0;
            padding: 20px;
            background-color: #f8f9fa;
            border-left: 4px solid #007bff;
            border-radius: 4px;
          }
          .button { 
            display: inline-block; 
            padding: 15px 30px; 
            background: linear-gradient(135deg, #28a745, #20c997);
            color: white !important; 
            text-decoration: none; 
            border-radius: 6px; 
            margin: 20px 0;
            font-weight: bold;
            font-size: 16px;
            text-align: center;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            transition: transform 0.2s;
          }
          .button:hover {
            transform: translateY(-2px);
          }
          .footer { 
            margin-top: 40px; 
            padding: 20px 0; 
            text-align: center; 
            font-size: 14px; 
            color: #6c757d;
            border-top: 1px solid #dee2e6;
          }
          .footer strong {
            color: #2c3e50;
          }
          .highlight {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>True North Business Loan</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Your Trusted Funding Partner</p>
          </div>
          
          <div class="content">
            <div class="greeting">Hello [First Name],</div>
            
            <div class="message-content">
              ${message.replace(/\n/g, '<br>')}
            </div>
            
            ${emailType === 'payment_reminder' && paymentLink ? `
              <div class="highlight">
                <p style="margin: 0; color: #856404;"><strong>⚠️ Action Required:</strong> Please complete your payment to continue accessing our services.</p>
              </div>
              <div style="text-align: center;">
                <a href="[Payment Link]" class="button">💳 Complete Payment Now</a>
              </div>
            ` : ''}
            
            ${emailType === 'credit_reminder' ? `
              <div class="highlight">
                <p style="margin: 0; color: #856404;"><strong>💡 Need More Leads?</strong> Purchase additional leads to grow your business.</p>
              </div>
              <div style="text-align: center;">
                <a href="[Payment Link]" class="button">🚀 Purchase More Leads</a>
              </div>
            ` : ''}
          </div>
          
          <div class="footer">
            <p><strong>Best regards,</strong><br>True North Business Loan Team</p>
            <p>Company: [Company Name]</p>
            <p style="font-size: 12px; margin-top: 20px;">
              This email was sent from True North Business Loan. If you have any questions, please reply to this email.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
  
  return replaceVariables(baseTemplate, variables);
};

const handler = async (req: Request): Promise<Response> => {
  console.log('Custom client email function called');

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, message, clientName, companyName, emailType, paymentLink, firstName }: EmailRequest = await req.json();

    console.log('Sending custom email to:', to);
    console.log('Email type:', emailType);

    // Extract first name if not provided
    const extractedFirstName = firstName || clientName.split(' ')[0];

    // Prepare variables for template replacement
    const variables = {
      'First Name': extractedFirstName,
      'Company Name': companyName,
      'Payment Link': paymentLink || '#',
      'Stripe Link': paymentLink || '#'
    };

    // Generate HTML template
    const htmlContent = getEmailTemplate(emailType, extractedFirstName, companyName, message, paymentLink);

    // Replace variables in subject line as well
    let processedSubject = subject;
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `[${key}]`;
      processedSubject = processedSubject.replace(new RegExp(placeholder, 'g'), value);
    });

    // Send email using Resend with the same validated domain as partner emails
    const emailResponse = await resend.emails.send({
      from: "True North Business Loan <noreply@email.truenorthbusinessloan.ca>",
      to: to,
      subject: processedSubject,
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