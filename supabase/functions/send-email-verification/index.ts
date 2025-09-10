import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailVerificationRequest {
  leadId: string;
  email: string;
  name: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { leadId, email, name }: EmailVerificationRequest = await req.json();
    
    // Generate verification token
    const verificationToken = crypto.randomUUID();
    
    // Update lead with verification token
    const { error: updateError } = await supabase
      .from('quiz_responses')
      .update({
        email_verification_token: verificationToken,
        email_verification_sent_at: new Date().toISOString()
      })
      .eq('id', leadId);

    if (updateError) {
      console.error('Error updating lead:', updateError);
      throw new Error('Failed to update lead with verification token');
    }

    // Create verification URL
    const baseUrl = Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '') || 'http://localhost:54321';
    const verificationUrl = `${baseUrl}/functions/v1/verify-email?token=${verificationToken}`;

    // Send verification email with branded template
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "True North Business Funding <onboarding@resend.dev>";
    const emailResponse = await resend.emails.send({
      from: fromEmail,
      to: [email],
      subject: "Please verify your email address - True North Business Funding",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Email Verification - True North Business Funding</title>
            <style>
                body { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                    line-height: 1.6; 
                    margin: 0; 
                    padding: 0; 
                    background-color: #f8fafc; 
                }
                .container { 
                    max-width: 600px; 
                    margin: 20px auto; 
                    background: #ffffff; 
                    border-radius: 8px; 
                    overflow: hidden; 
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); 
                }
                .header { 
                    background: #1e3a8a; 
                    color: #ffffff; 
                    padding: 40px 30px; 
                    text-align: center; 
                }
                .header h1 { 
                    margin: 0; 
                    font-size: 28px; 
                    font-weight: 600; 
                    color: #ffffff; 
                }
                .header p { 
                    margin: 10px 0 0 0; 
                    font-size: 16px; 
                    color: #ffffff; 
                    opacity: 0.9; 
                }
                .content { 
                    padding: 40px 30px; 
                    background: #ffffff; 
                }
                .greeting {
                    font-size: 18px;
                    color: #1e3a8a;
                    margin-bottom: 20px;
                    font-weight: 500;
                }
                .message {
                    font-size: 16px;
                    color: #1e3a8a;
                    margin-bottom: 30px;
                    line-height: 1.6;
                }
                .cta-section { 
                    background: #ffffff; 
                    padding: 30px; 
                    margin: 30px 0; 
                    border-radius: 8px; 
                    text-align: center; 
                    border: 2px solid #10b981;
                }
                .cta-button { 
                    display: inline-block; 
                    background: #10b981; 
                    color: #ffffff; 
                    padding: 15px 35px; 
                    border-radius: 8px; 
                    text-decoration: none; 
                    font-weight: 600; 
                    font-size: 16px;
                    margin: 10px 0; 
                }
                .cta-button:hover {
                    background: #059669;
                }
                .alternative {
                    background: #f8fafc;
                    padding: 25px;
                    border-radius: 8px;
                    margin: 25px 0;
                    border: 1px solid #e5e7eb;
                }
                .alternative h3 {
                    margin: 0 0 15px 0;
                    color: #1e3a8a;
                    font-size: 16px;
                    font-weight: 600;
                }
                .alternative p {
                    margin: 10px 0;
                    color: #1e3a8a;
                    font-size: 14px;
                }
                .link-text {
                    word-break: break-all;
                    background: #ffffff;
                    padding: 15px;
                    border-radius: 4px;
                    border: 1px solid #e5e7eb;
                    font-family: monospace;
                    font-size: 12px;
                    color: #10b981;
                    margin: 10px 0;
                }
                .security-note {
                    background: #fef3c7;
                    border: 1px solid #f59e0b;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 25px 0;
                }
                .security-note p {
                    margin: 0;
                    color: #92400e;
                    font-size: 14px;
                    font-weight: 500;
                }
                .footer { 
                    background: #f8fafc; 
                    padding: 25px; 
                    text-align: center; 
                    color: #1e3a8a; 
                    font-size: 14px; 
                    border-top: 1px solid #e5e7eb;
                }
                .footer p {
                    margin: 5px 0;
                    color: #1e3a8a;
                }
                .footer strong {
                    color: #1e3a8a;
                }
                @media (max-width: 600px) {
                    .container { margin: 10px; }
                    .header, .content { padding: 20px; }
                    .cta-section { padding: 20px; }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔐 Email Verification</h1>
                    <p>True North Business Funding</p>
                </div>
                
                <div class="content">
                    <div class="greeting">
                        Hi ${name || 'there'},
                    </div>
                    
                    <div class="message">
                        Thank you for your interest in our business funding solutions! To complete your lead submission and ensure we can communicate with you effectively, please verify your email address.
                    </div>
                    
                    <div class="cta-section">
                        <a href="${verificationUrl}" class="cta-button">
                            ✓ Verify My Email Address
                        </a>
                        <p style="margin-top: 15px; color: #1e3a8a; font-size: 14px;">
                            Click the button above to verify your email instantly
                        </p>
                    </div>
                    
                    <div class="alternative">
                        <h3>Alternative Method:</h3>
                        <p>If the button doesn't work, copy and paste this link into your browser:</p>
                        <div class="link-text">${verificationUrl}</div>
                    </div>
                    
                    <div class="security-note">
                        <p>
                            🛡️ Security Notice: This verification link will expire in 24 hours for your protection.
                        </p>
                    </div>
                </div>
                
                <div class="footer">
                    <p><strong>True North Business Funding</strong></p>
                    <p>Connecting businesses with the right funding solutions</p>
                    <p style="font-size: 12px; margin-top: 15px;">
                        If you didn't request this verification, you can safely ignore this email.
                    </p>
                </div>
            </div>
        </body>
        </html>
      `,
    });

    if (emailResponse?.error) {
      console.error("Resend error sending verification email:", emailResponse.error);
      return new Response(JSON.stringify({ 
        success: false, 
        error: emailResponse.error 
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    console.log("Verification email queued:", emailResponse.data);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Verification email sent successfully',
      emailId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-email-verification function:", error);
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