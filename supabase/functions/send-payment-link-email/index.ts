import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  applicationId: string;
  recipientEmail: string;
  recipientName: string;
  companyName: string;
  paymentAmount: number;
  paymentDeadline: string;
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-PAYMENT-LINK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Initialize Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }
    const resend = new Resend(resendApiKey);
    logStep("Resend initialized");

    // Initialize Supabase with service role
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Authenticate the request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Check if user has management access
    const { data: userRoles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const hasManagementAccess = userRoles?.some(role => 
      ['superadmin', 'lender', 'broker'].includes(role.role)
    );

    if (!hasManagementAccess) {
      throw new Error("Insufficient permissions");
    }
    logStep("User permissions verified");

    // Parse request body
    const { 
      applicationId, 
      recipientEmail, 
      recipientName, 
      companyName,
      paymentAmount,
      paymentDeadline 
    }: EmailRequest = await req.json();

    logStep("Request parsed", { applicationId, recipientEmail });

    // Generate payment link (placeholder for now - will be updated when Stripe is connected)
    const baseUrl = req.headers.get("origin") || "https://your-domain.com";
    const paymentLink = `${baseUrl}/partner-payment?application=${applicationId}`;
    
    logStep("Payment link generated", { paymentLink });

    // Create email content
    const formattedAmount = (paymentAmount / 100).toFixed(2);
    const formattedDeadline = new Date(paymentDeadline).toLocaleDateString();

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Complete Your Payment - Lead Access</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🚀 Your Lead Access is Ready!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Complete your payment to unlock premium leads</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="color: #2c3e50; margin-top: 0;">Hi ${recipientName},</h2>
            <p>Your broker application for <strong>${companyName}</strong> has been reviewed and approved! 🎉</p>
            <p>To activate your lead access and start receiving high-quality, pre-qualified leads, please complete your payment below.</p>
          </div>

          <div style="background: white; border: 2px solid #e74c3c; border-radius: 8px; padding: 25px; margin-bottom: 25px; text-align: center;">
            <h3 style="color: #e74c3c; margin-top: 0;">⏰ Payment Required</h3>
            <div style="font-size: 32px; font-weight: bold; color: #2c3e50; margin: 15px 0;">$${formattedAmount}</div>
            <p style="margin: 0; color: #7f8c8d;">Due by: <strong>${formattedDeadline}</strong></p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${paymentLink}" style="background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 18px; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              💳 Complete Payment Now
            </a>
          </div>

          <div style="background: #e8f5e8; border-left: 4px solid #28a745; padding: 20px; margin: 25px 0;">
            <h3 style="color: #155724; margin-top: 0;">✅ What You Get:</h3>
            <ul style="margin: 0; padding-left: 20px; color: #155724;">
              <li>10 premium, pre-qualified leads</li>
              <li>Complete contact information (name, phone, email)</li>
              <li>Loan amount and business details</li>
              <li>Same-day response expected</li>
              <li>Credit scores 600+ guaranteed</li>
            </ul>
          </div>

          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;"><strong>⚠️ Important:</strong> Leads are time-sensitive. Complete your payment quickly to ensure the best response rates.</p>
          </div>

          <div style="text-align: center; margin-top: 40px; padding-top: 25px; border-top: 1px solid #dee2e6;">
            <p style="color: #6c757d; font-size: 14px; margin: 0;">Questions? Reply to this email or contact our support team.</p>
            <p style="color: #6c757d; font-size: 12px; margin: 10px 0 0 0;">This payment link will expire on ${formattedDeadline}</p>
          </div>
        </body>
      </html>
    `;

    // Send email
    const emailResponse = await resend.emails.send({
      from: "Lead Access <noreply@yourdomain.com>",
      to: [recipientEmail],
      subject: `🚀 Payment Required: Unlock Your $${formattedAmount} Lead Package`,
      html: emailHtml,
    });

    logStep("Email sent", { emailId: emailResponse.data?.id });

    // Update application with email sent timestamp
    await supabaseClient
      .from('lender_broker_applications')
      .update({ 
        updated_at: new Date().toISOString(),
        admin_notes: `Payment reminder email sent on ${new Date().toISOString()}`
      })
      .eq('id', applicationId);

    logStep("Application updated");

    return new Response(JSON.stringify({ 
      success: true, 
      emailId: emailResponse.data?.id,
      message: "Payment link email sent successfully"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      success: false 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});