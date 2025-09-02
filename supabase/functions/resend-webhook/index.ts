import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // For development/testing, log all webhook events even without signature
    const body = await req.text();
    const webhook = JSON.parse(body);
    console.log('Received Resend webhook:', webhook);

    // Enforce webhook signature verification for security
    const signature = req.headers.get('resend-signature');
    const webhookSecret = Deno.env.get('RESEND_WEBHOOK_SECRET');
    
    if (!webhookSecret) {
      console.error('RESEND_WEBHOOK_SECRET not configured - webhook rejected for security');
      return new Response('Webhook secret not configured', { status: 500, headers: corsHeaders });
    }
    
    if (!signature) {
      console.error('Missing resend-signature header - webhook rejected');
      return new Response('Missing signature', { status: 401, headers: corsHeaders });
    }
    
    // Verify signature using crypto
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(webhookSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Extract signature from header (format: "v1=signature" or just the signature)
    const receivedSignature = signature.includes('=') ? signature.split('=')[1] : signature;
    
    if (expectedSignature !== receivedSignature) {
      console.error('Invalid webhook signature. Expected:', expectedSignature, 'Received:', receivedSignature);
      return new Response('Invalid signature', { status: 401, headers: corsHeaders });
    }
    
    console.log('Webhook signature verified successfully');
    const { type, data } = webhook;
    
    if (!data?.email_id) {
      console.log('No email_id in webhook data');
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    // First try to find in email_sends table
    const { data: emailSend, error: findError } = await supabase
      .from('email_sends')
      .select('*')
      .eq('resend_email_id', data.email_id)
      .single();

    // Also try to find in lead_custom_emails table
    const { data: leadEmail, error: leadEmailError } = await supabase
      .from('lead_custom_emails')
      .select('*')
      .eq('resend_email_id', data.email_id)
      .single();

    if ((findError || !emailSend) && (leadEmailError || !leadEmail)) {
      console.log(`Email send record not found for email_id: ${data.email_id}`);
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    // Update based on event type for both tables
    const emailSendUpdates: any = {};
    const leadEmailUpdates: any = {};
    
    switch (type) {
      case 'email.delivered':
        const deliveredAt = new Date().toISOString();
        emailSendUpdates.delivered_at = deliveredAt;
        leadEmailUpdates.delivered_at = deliveredAt;
        leadEmailUpdates.delivery_status = 'delivered';
        if (emailSend?.status === 'sent') {
          emailSendUpdates.status = 'delivered';
        }
        break;
        
      case 'email.opened':
        emailSendUpdates.opened_at = new Date().toISOString();
        emailSendUpdates.open_count = (emailSend?.open_count || 0) + 1;
        if (emailSend && ['sent', 'delivered'].includes(emailSend.status)) {
          emailSendUpdates.status = 'opened';
        }
        break;
        
      case 'email.clicked':
        emailSendUpdates.clicked_at = new Date().toISOString();
        emailSendUpdates.click_count = (emailSend?.click_count || 0) + 1;
        emailSendUpdates.status = 'clicked';
        break;
        
      case 'email.bounced':
      case 'email.complaint':
        const errorMessage = `${type}: ${data.reason || 'Unknown reason'}`;
        emailSendUpdates.status = 'failed';
        emailSendUpdates.error_message = errorMessage;
        leadEmailUpdates.delivery_status = 'failed';
        leadEmailUpdates.error_message = errorMessage;
        break;
        
      default:
        console.log(`Unhandled webhook type: ${type}`);
        return new Response('OK', { status: 200, headers: corsHeaders });
    }

    // Update email_sends table if record exists
    if (emailSend && Object.keys(emailSendUpdates).length > 0) {
      const { error: updateError } = await supabase
        .from('email_sends')
        .update(emailSendUpdates)
        .eq('id', emailSend.id);

      if (updateError) {
        console.error('Error updating email send:', updateError);
      } else {
        console.log(`Updated email send ${emailSend.id} for event ${type}`);
      }
    }

    // Update lead_custom_emails table if record exists
    if (leadEmail && Object.keys(leadEmailUpdates).length > 0) {
      const { error: updateLeadEmailError } = await supabase
        .from('lead_custom_emails')
        .update(leadEmailUpdates)
        .eq('id', leadEmail.id);

      if (updateLeadEmailError) {
        console.error('Error updating lead custom email:', updateLeadEmailError);
      } else {
        console.log(`Updated lead custom email ${leadEmail.id} for event ${type}`);
      }
    }

    return new Response('OK', { status: 200, headers: corsHeaders });

  } catch (error: any) {
    console.error('Error in resend-webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
};

serve(handler);