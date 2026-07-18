import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: 'quiz' | 'application' | 'canadian_application';
  data: any;
  submissionId: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('Admin notification request received');

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, data, submissionId }: NotificationRequest = await req.json();
    console.log('Processing notification:', { type, submissionId });

    // Get admin notification settings
    const { data: settings, error: settingsError } = await supabase
      .from('admin_notification_settings')
      .select('*')
      .single();

    if (settingsError) {
      console.error('Error fetching notification settings:', settingsError);
      throw new Error('Failed to fetch notification settings');
    }

    let subject: string;
    let emailTemplate: string;
    let notificationEmail: string;
    let adminUrl: string;

    const baseUrl = supabaseUrl.includes('localhost') 
      ? 'http://localhost:8080' 
      : `https://${supabaseUrl.split('//')[1].split('.')[0]}.lovable.app`;

    switch (type) {
      case 'quiz':
        if (!settings.is_quiz_notifications_enabled) {
          console.log('Quiz notifications are disabled');
          return new Response(JSON.stringify({ message: 'Quiz notifications disabled' }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }
        
        subject = `🎯 New Quiz Submission - ${data.name}`;
        notificationEmail = settings.quiz_notification_email;
        adminUrl = `${baseUrl}/admin`;
        
        emailTemplate = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Quiz Submission</title>
            <style>
              body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; }
              .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; }
              .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; }
              .header p { color: #e2e8f0; margin: 10px 0 0 0; font-size: 16px; }
              .content { padding: 40px 30px; }
              .info-card { background-color: #f8fafc; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 8px; }
              .info-row { display: flex; margin-bottom: 12px; }
              .info-label { font-weight: 600; color: #374151; width: 150px; }
              .info-value { color: #6b7280; flex: 1; }
              .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; box-shadow: 0 4px 14px 0 rgba(102, 126, 234, 0.39); }
              .footer { background-color: #f8fafc; padding: 20px 30px; text-align: center; color: #6b7280; font-size: 14px; }
              .highlight { background-color: #fef3c7; padding: 2px 6px; border-radius: 4px; font-weight: 600; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎯 New Quiz Submission</h1>
                <p>A new prospect has completed the funding quiz</p>
              </div>
              
              <div class="content">
                <p>Hello Admin,</p>
                <p>You have received a new quiz submission from a potential customer. Here are the details:</p>
                
                <div class="info-card">
                  <div class="info-row">
                    <div class="info-label">Name:</div>
                    <div class="info-value"><strong>${data.name}</strong></div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Email:</div>
                    <div class="info-value">${data.email}</div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Phone:</div>
                    <div class="info-value">${data.phone || 'Not provided'}</div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Company Name:</div>
                    <div class="info-value"><strong>${data.company_name || 'Not provided'}</strong></div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Website:</div>
                    <div class="info-value">${data.website || 'Not provided'}</div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Location:</div>
                    <div class="info-value">${data.city_province || 'Not provided'}, ${data.country || 'Not provided'}</div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Loan Amount:</div>
                    <div class="info-value"><span class="highlight">$${data.loan_amount?.toLocaleString()}</span></div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Monthly Revenue:</div>
                    <div class="info-value">$${data.monthly_revenue?.toLocaleString()}</div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Credit Score:</div>
                    <div class="info-value">${data.credit_score}</div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Use of Funds:</div>
                    <div class="info-value">${data.use_of_funds}</div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Time in Business:</div>
                    <div class="info-value">${data.time_in_business}</div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Score:</div>
                    <div class="info-value"><strong>${data.score}/100</strong></div>
                  </div>
                </div>
                
                <p style="text-align: center;">
                  <a href="${adminUrl}" class="cta-button">View in Admin Panel</a>
                </p>
                
                <p><strong>Next Steps:</strong></p>
                <ul>
                  <li>Review the submission in your admin panel</li>
                  <li>Contact the prospect to discuss their funding needs</li>
                  <li>Update the status as you progress through your process</li>
                </ul>
              </div>
              
              <div class="footer">
                <p>This is an automated notification from your business loan platform.</p>
                <p>Please do not reply to this email.</p>
              </div>
            </div>
          </body>
          </html>
        `;
        break;

      case 'application':
        if (!settings.is_application_notifications_enabled) {
          console.log('Application notifications are disabled');
          return new Response(JSON.stringify({ message: 'Application notifications disabled' }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }
        
        subject = `📄 New USA Application - ${data.legal_corporation_name}`;
        notificationEmail = settings.application_notification_email;
        adminUrl = `${baseUrl}/admin`;
        
        emailTemplate = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New USA Application</title>
            <style>
              body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; }
              .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
              .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center; }
              .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; }
              .header p { color: #d1fae5; margin: 10px 0 0 0; font-size: 16px; }
              .content { padding: 40px 30px; }
              .info-card { background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 8px; }
              .info-row { display: flex; margin-bottom: 12px; }
              .info-label { font-weight: 600; color: #374151; width: 150px; }
              .info-value { color: #6b7280; flex: 1; }
              .cta-button { display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; box-shadow: 0 4px 14px 0 rgba(16, 185, 129, 0.39); }
              .footer { background-color: #f8fafc; padding: 20px 30px; text-align: center; color: #6b7280; font-size: 14px; }
              .highlight { background-color: #dcfce7; padding: 2px 6px; border-radius: 4px; font-weight: 600; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>📄 New USA Application</h1>
                <p>A complete business loan application has been submitted</p>
              </div>
              
              <div class="content">
                <p>Hello Admin,</p>
                <p>You have received a new USA business loan application. Here are the key details:</p>
                
                <div class="info-card">
                  <div class="info-row">
                    <div class="info-label">Reference #:</div>
                    <div class="info-value"><strong>${data.application_reference_number}</strong></div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Business Name:</div>
                    <div class="info-value"><strong>${data.legal_corporation_name}</strong></div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Principal:</div>
                    <div class="info-value">${data.principal_name}</div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Email:</div>
                    <div class="info-value">${data.principal_email}</div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Phone:</div>
                    <div class="info-value">${data.principal_cell_phone || data.principal_home_phone || 'Not provided'}</div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Loan Amount:</div>
                    <div class="info-value"><span class="highlight">$${data.loan_amount_requested?.toLocaleString()}</span></div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Business Type:</div>
                    <div class="info-value">${data.business_type}</div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Location:</div>
                    <div class="info-value">${data.city}, ${data.state}</div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Time in Business:</div>
                    <div class="info-value">${data.years_in_business} years, ${data.months_in_business} months</div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Use of Funds:</div>
                    <div class="info-value">${data.use_of_funds}</div>
                  </div>
                </div>
                
                <p style="text-align: center;">
                  <a href="${adminUrl}" class="cta-button">View Application Details</a>
                </p>
                
                <p><strong>Next Steps:</strong></p>
                <ul>
                  <li>Review the complete application in your admin panel</li>
                  <li>Verify submitted documents</li>
                  <li>Contact the applicant for any additional information</li>
                  <li>Update the application status as you progress</li>
                </ul>
              </div>
              
              <div class="footer">
                <p>This is an automated notification from your business loan platform.</p>
                <p>Please do not reply to this email.</p>
              </div>
            </div>
          </body>
          </html>
        `;
        break;

      case 'canadian_application':
        if (!settings.is_application_notifications_enabled) {
          console.log('Application notifications are disabled');
          return new Response(JSON.stringify({ message: 'Application notifications disabled' }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }
        
        subject = `🍁 New Canadian Application - ${data.legal_business_name}`;
        notificationEmail = settings.application_notification_email;
        adminUrl = `${baseUrl}/admin`;
        
        emailTemplate = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Canadian Application</title>
            <style>
              body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; }
              .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
              .header { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 40px 30px; text-align: center; }
              .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; }
              .header p { color: #fecaca; margin: 10px 0 0 0; font-size: 16px; }
              .content { padding: 40px 30px; }
              .info-card { background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0; border-radius: 8px; }
              .info-row { display: flex; margin-bottom: 12px; }
              .info-label { font-weight: 600; color: #374151; width: 150px; }
              .info-value { color: #6b7280; flex: 1; }
              .cta-button { display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; box-shadow: 0 4px 14px 0 rgba(220, 38, 38, 0.39); }
              .footer { background-color: #f8fafc; padding: 20px 30px; text-align: center; color: #6b7280; font-size: 14px; }
              .highlight { background-color: #fee2e2; padding: 2px 6px; border-radius: 4px; font-weight: 600; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🍁 New Canadian Application</h1>
                <p>A complete Canadian business application has been submitted</p>
              </div>
              
              <div class="content">
                <p>Hello Admin,</p>
                <p>You have received a new Canadian business loan application. Here are the key details:</p>
                
                <div class="info-card">
                  <div class="info-row">
                    <div class="info-label">Reference #:</div>
                    <div class="info-value"><strong>${data.application_reference_number}</strong></div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Business Name:</div>
                    <div class="info-value"><strong>${data.legal_business_name}</strong></div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Principal:</div>
                    <div class="info-value">${data.principal_owner_name}</div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Email:</div>
                    <div class="info-value">${data.email_address}</div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Phone:</div>
                    <div class="info-value">${data.cell_phone || data.home_phone || data.business_phone}</div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Loan Amount:</div>
                    <div class="info-value"><span class="highlight">$${data.amount_requested?.toLocaleString()}</span></div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Annual Sales:</div>
                    <div class="info-value">$${data.annual_gross_sales?.toLocaleString()}</div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Location:</div>
                    <div class="info-value">${data.city}, ${data.state}</div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Entity Type:</div>
                    <div class="info-value">${data.type_of_entity}</div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Use of Funds:</div>
                    <div class="info-value">${data.use_of_funds}</div>
                  </div>
                </div>
                
                <p style="text-align: center;">
                  <a href="${adminUrl}" class="cta-button">View Application Details</a>
                </p>
                
                <p><strong>Next Steps:</strong></p>
                <ul>
                  <li>Review the complete application in your admin panel</li>
                  <li>Verify submitted documents</li>
                  <li>Contact the applicant for any additional information</li>
                  <li>Update the application status as you progress</li>
                </ul>
              </div>
              
              <div class="footer">
                <p>This is an automated notification from your business loan platform.</p>
                <p>Please do not reply to this email.</p>
              </div>
            </div>
          </body>
          </html>
        `;
        break;

      default:
        throw new Error(`Unknown notification type: ${type}`);
    }

    const emailResponse = await resend.emails.send({
      from: "Loan Admin <noreply@resend.dev>",
      to: [notificationEmail],
      subject: subject,
      html: emailTemplate,
    });

    console.log("Admin notification sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      emailId: emailResponse.data?.id,
      sentTo: notificationEmail 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error sending admin notification:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);