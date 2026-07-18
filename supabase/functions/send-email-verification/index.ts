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

    // Create verification URL - ensure we use the correct project URL format
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const projectRef = supabaseUrl.split('.')[0].split('//')[1]; // Extract project reference
    const verificationUrl = `https://${projectRef}.supabase.co/functions/v1/verify-email?token=${verificationToken}`;
    
    console.log('Generated verification URL:', verificationUrl);

    // Send verification email with clean, deliverable format
    const fromEmail = "True North Business Loan <noreply@email.truenorthbusinessloan.ca>";
    const emailResponse = await resend.emails.send({
      from: fromEmail,
      to: [email],
      subject: "Please verify your email - True North Business Loan",
      html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verification - True North Business Funding</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <tr>
            <td style="background-color: #2563eb; padding: 30px; text-align: center;">
                <h1 style="margin: 0; color: #ffffff; font-size: 24px;">Email Verification</h1>
                <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px;">True North Business Funding</p>
            </td>
        </tr>
        <tr>
            <td style="padding: 30px;">
                <p style="font-size: 18px; color: #2563eb; margin-bottom: 20px;">Hi ${name || 'there'},</p>
                
                <p style="color: #333333; margin-bottom: 20px;"><strong>Welcome to True North Business Funding!</strong></p>
                
                <p style="color: #333333; margin-bottom: 20px;">
                    Thank you for your interest in our business funding solutions. We are already working to find the best funding matches for your business, and our team is reviewing your submission to connect you with the most suitable lenders from our network.
                </p>
                
                <p style="color: #333333; margin-bottom: 30px;">
                    To proceed and ensure you receive your personalized funding options, please verify your email address by clicking the button below. This verification helps us confirm you are a real business owner and ensures our communications reach you directly.
                </p>
                
                <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="text-align: center; padding: 20px 0;">
                            <a href="${verificationUrl}" style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">Verify My Email Address</a>
                        </td>
                    </tr>
                </table>
                
                <p style="color: #333333; text-align: center; margin-bottom: 30px; font-size: 14px;">
                    Click the button above to verify your email and unlock your funding matches
                </p>
                
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="margin: 0 0 15px 0; color: #2563eb; font-size: 16px;">Alternative Method:</h3>
                    <p style="color: #333333; margin: 10px 0;">If the button does not work, copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; background-color: #ffffff; padding: 10px; border: 1px solid #e5e7eb; border-radius: 3px; font-family: monospace; font-size: 12px; color: #10b981;">${verificationUrl}</p>
                </div>
                
                <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 0; color: #92400e; font-size: 14px;">
                        Security Notice: This verification link will expire in 24 hours for your protection.
                    </p>
                </div>
            </td>
        </tr>
        <tr>
            <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="margin: 5px 0; color: #2563eb; font-weight: bold;">True North Business Funding</p>
                <p style="margin: 5px 0; color: #2563eb;">Connecting businesses with the right funding solutions</p>
                <p style="margin: 15px 0 5px 0; color: #6b7280; font-size: 12px;">
                    If you did not request this verification, you can safely ignore this email.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>`,
      text: `EMAIL VERIFICATION - True North Business Funding

Hi ${name || 'there'},

Welcome to True North Business Funding!

Thank you for your interest in our business funding solutions. We are already working to find the best funding matches for your business, and our team is reviewing your submission to connect you with the most suitable lenders from our network.

To proceed and ensure you receive your personalized funding options, please verify your email address by clicking the link below. This verification helps us confirm you are a real business owner and ensures our communications reach you directly.

VERIFY YOUR EMAIL:
${verificationUrl}

Click or copy the link above to verify your email and unlock your funding matches.

SECURITY NOTICE: This verification link will expire in 24 hours for your protection.

---
True North Business Funding
Connecting businesses with the right funding solutions

If you did not request this verification, you can safely ignore this email.`,
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