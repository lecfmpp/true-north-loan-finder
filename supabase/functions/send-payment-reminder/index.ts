import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentReminderRequest {
  clientId: string;
  customPaymentLink?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientId, customPaymentLink }: PaymentReminderRequest = await req.json();

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get client details
    const { data: client, error: clientError } = await supabaseClient
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      throw new Error("Client not found");
    }

    // Get payment reminder email template
    const { data: sequence, error: sequenceError } = await supabaseClient
      .from('email_sequences')
      .select(`
        *,
        email_templates(*)
      `)
      .eq('name', 'payment_reminder')
      .eq('is_active', true)
      .single();

    if (sequenceError || !sequence) {
      throw new Error("Payment reminder email template not found");
    }

    const template = sequence.email_templates?.[0];
    if (!template) {
      throw new Error("Payment reminder email template not configured");
    }

    // Determine payment link to use
    let paymentLink = customPaymentLink;
    if (!paymentLink && client.stripe_payment_link_id) {
      // Generate payment link URL from Stripe payment link ID
      paymentLink = `https://buy.stripe.com/${client.stripe_payment_link_id}`;
    }

    if (!paymentLink) {
      throw new Error("No payment link available");
    }

    // Send email using the send-email-sequence function
    const emailResponse = await supabaseClient.functions.invoke('send-email-sequence', {
      body: {
        type: 'direct_template',
        templateId: template.id,
        userEmail: client.email,
        userName: client.name,
        variables: {
          'Payment Link': paymentLink,
          'First Name': client.name.split(' ')[0],
        }
      }
    });

    if (emailResponse.error) {
      throw new Error(`Failed to send email: ${emailResponse.error.message}`);
    }

    // Update client with reminder sent timestamp
    const { error: updateError } = await supabaseClient
      .from('clients')
      .update({
        payment_reminder_sent_at: new Date().toISOString(),
      })
      .eq('id', clientId);

    if (updateError) {
      console.error("Error updating client reminder timestamp:", updateError);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Payment reminder sent successfully",
        emailSent: true
      }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error sending payment reminder:", error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});