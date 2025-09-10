import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return new Response(
        `<html>
          <head><title>Invalid Verification Link</title></head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2 style="color: #dc3545;">Invalid Verification Link</h2>
            <p>The verification link is invalid or malformed.</p>
          </body>
        </html>`,
        { 
          status: 400, 
          headers: { 'Content-Type': 'text/html', ...corsHeaders }
        }
      );
    }

    // Find lead with this verification token
    const { data: lead, error: findError } = await supabase
      .from('quiz_responses')
      .select('*')
      .eq('email_verification_token', token)
      .eq('email_verified', false)
      .single();

    if (findError || !lead) {
      console.error('Lead not found or already verified:', findError);
      return new Response(
        `<html>
          <head><title>Verification Failed</title></head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2 style="color: #dc3545;">Verification Failed</h2>
            <p>The verification link is invalid, expired, or has already been used.</p>
          </body>
        </html>`,
        { 
          status: 400, 
          headers: { 'Content-Type': 'text/html', ...corsHeaders }
        }
      );
    }

    // Check if verification was sent within last 24 hours
    const sentAt = new Date(lead.email_verification_sent_at);
    const now = new Date();
    const hoursDiff = (now.getTime() - sentAt.getTime()) / (1000 * 60 * 60);

    if (hoursDiff > 24) {
      return new Response(
        `<html>
          <head><title>Verification Expired</title></head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2 style="color: #dc3545;">Verification Link Expired</h2>
            <p>This verification link has expired for security reasons. Please request a new verification email.</p>
          </body>
        </html>`,
        { 
          status: 400, 
          headers: { 'Content-Type': 'text/html', ...corsHeaders }
        }
      );
    }

    // Mark email as verified
    const { error: updateError } = await supabase
      .from('quiz_responses')
      .update({
        email_verified: true,
        email_verified_at: new Date().toISOString(),
        email_verification_token: null // Clear token after successful verification
      })
      .eq('id', lead.id);

    if (updateError) {
      console.error('Error updating lead verification status:', updateError);
      throw new Error('Failed to update verification status');
    }

    console.log(`Email verified successfully for lead ${lead.id}`);

    return new Response(
      `<html>
        <head>
          <title>Email Verified Successfully</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #f8f9fa;">
          <div style="max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="color: #28a745; font-size: 60px; margin-bottom: 20px;">✓</div>
            <h2 style="color: #28a745; margin-bottom: 10px;">Email Verified Successfully!</h2>
            <p style="color: #666; font-size: 16px;">Thank you for verifying your email address. Your lead submission is now complete and verified.</p>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">You can now close this window.</p>
          </div>
        </body>
      </html>`,
      { 
        status: 200, 
        headers: { 'Content-Type': 'text/html', ...corsHeaders }
      }
    );

  } catch (error: any) {
    console.error("Error in verify-email function:", error);
    return new Response(
      `<html>
        <head><title>Verification Error</title></head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h2 style="color: #dc3545;">Verification Error</h2>
          <p>An error occurred while verifying your email. Please try again later.</p>
        </body>
      </html>`,
      {
        status: 500,
        headers: { "Content-Type": "text/html", ...corsHeaders },
      }
    );
  }
};

serve(handler);