import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ConfirmationEmailRequest {
  applicantName: string;
  applicantEmail: string;
  companyName: string;
  applicationType: string;
}

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { applicantName, applicantEmail, companyName, applicationType }: ConfirmationEmailRequest = await req.json();

    // Create the confirmation email HTML template
    const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Application Received - True North Funding</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 40px 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 32px; font-weight: 600; }
            .header p { margin: 15px 0 0 0; font-size: 18px; opacity: 0.9; }
            .content { padding: 40px 30px; }
            .success-badge { background: #E6FFFA; border: 2px solid #10B981; border-radius: 50px; padding: 20px; margin: 30px 0; text-align: center; }
            .success-badge h2 { color: #10B981; margin: 0; font-size: 24px; }
            .application-details { background: #F8FAFC; border-left: 4px solid #10B981; padding: 25px; margin: 25px 0; border-radius: 0 8px 8px 0; }
            .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #E2E8F0; }
            .detail-label { font-weight: 600; color: #475569; }
            .detail-value { color: #334155; }
            .next-steps { background: #EFF6FF; border: 1px solid #BFDBFE; padding: 25px; border-radius: 10px; margin: 25px 0; }
            .next-steps h3 { color: #1E40AF; margin: 0 0 15px 0; }
            .timeline { list-style: none; padding: 0; }
            .timeline li { position: relative; padding: 15px 0 15px 30px; }
            .timeline li:before { content: '✓'; position: absolute; left: 0; top: 18px; width: 20px; height: 20px; background: #10B981; color: white; border-radius: 50%; text-align: center; line-height: 20px; font-size: 12px; font-weight: bold; }
            .contact-info { background: #FFFBEB; border: 1px solid #FCD34D; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center; }
            .contact-info h3 { color: #92400E; margin: 0 0 10px 0; }
            .footer { background: #F8F9FA; padding: 30px; text-align: center; color: #666; }
            .logo { color: #10B981; font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            @media (max-width: 600px) {
                .container { margin: 10px; }
                .header, .content { padding: 25px 20px; }
                .detail-row { flex-direction: column; }
                .detail-label { margin-bottom: 5px; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">⭐ True North Funding</div>
                <h1>Application Received!</h1>
                <p>Thank you for your interest in becoming a partner</p>
            </div>
            
            <div class="content">
                <div class="success-badge">
                    <h2>🎉 Your ${applicationType} application has been successfully submitted!</h2>
                </div>

                <p>Dear <strong>${applicantName}</strong>,</p>
                
                <p>Thank you for submitting your ${applicationType.toLowerCase()} application to True North Funding. We're excited about the potential of partnering with <strong>${companyName}</strong> to help Canadian businesses access the funding they need to grow and thrive.</p>

                <div class="application-details">
                    <h3 style="margin: 0 0 15px 0; color: #334155;">📋 Application Summary</h3>
                    <div class="detail-row">
                        <span class="detail-label">Applicant Name:</span>
                        <span class="detail-value">${applicantName}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Company:</span>
                        <span class="detail-value">${companyName}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Application Type:</span>
                        <span class="detail-value">${applicationType}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Email:</span>
                        <span class="detail-value">${applicantEmail}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Submission Date:</span>
                        <span class="detail-value">${new Date().toLocaleDateString('en-CA', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}</span>
                    </div>
                </div>

                <div class="next-steps">
                    <h3>📅 What Happens Next?</h3>
                    <ul class="timeline">
                        <li><strong>Application Review:</strong> Our team will carefully review your application and qualifications within 24-48 hours.</li>
                        <li><strong>Background Check:</strong> We'll verify your credentials and licensing information.</li>
                        <li><strong>Decision Notification:</strong> You'll receive an email with our decision and next steps.</li>
                        <li><strong>Partnership Setup:</strong> If approved, we'll help you set up your personalized dashboard and provide training.</li>
                        <li><strong>Lead Access:</strong> Start receiving pre-qualified leads matching your criteria!</li>
                    </ul>
                </div>

                <div class="contact-info">
                    <h3>💬 Questions or Need Assistance?</h3>
                    <p>Our partnership team is here to help! Feel free to reach out if you have any questions about your application or our partnership program.</p>
                    <p><strong>Email:</strong> partnerships@truenorthfunding.ca<br>
                    <strong>Phone:</strong> 1-800-TRUE-NORTH</p>
                </div>

                <p style="margin-top: 30px; padding: 20px; background: #F0FDF4; border-radius: 8px; border-left: 4px solid #10B981;">
                    <strong style="color: #166534;">🚀 Why Partner With Us?</strong><br>
                    Join our network of successful ${applicationType.toLowerCase()}s who are connecting Canadian businesses with the funding they need. We provide pre-qualified leads, competitive commission structures, and ongoing support to help you grow your business.
                </p>

                <p style="color: #666; font-style: italic; text-align: center; margin-top: 40px;">
                    This email confirms we've received your application. Please keep this for your records.
                </p>
            </div>

            <div class="footer">
                <div class="logo">True North Funding</div>
                <p>Connecting Canadian businesses with the right financial solutions.</p>
                <p style="font-size: 12px; margin-top: 20px;">
                    If you have any questions, please don't hesitate to contact us at partnerships@truenorthfunding.ca
                </p>
            </div>
        </div>
    </body>
    </html>
    `;

    // Send the confirmation email
    const emailResponse = await resend.emails.send({
      from: "True North Funding <partnerships@truenorthfunding.ca>",
      to: [applicantEmail],
      subject: `✅ ${applicationType} Application Received - True North Funding`,
      html: emailHtml,
    });

    console.log("Confirmation email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      emailId: emailResponse.data?.id,
      applicantName,
      applicantEmail 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in send-application-confirmation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);