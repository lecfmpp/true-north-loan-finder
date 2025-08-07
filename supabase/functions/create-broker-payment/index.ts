import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { applicationId, trackingId, utmParams } = await req.json();

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get application details
    const { data: application, error: fetchError } = await supabaseClient
      .from('lender_broker_applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (fetchError || !application) {
      throw new Error('Application not found');
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Build success URL with tracking parameters
    const origin = req.headers.get("origin");
    const successUrl = new URL(`${origin}/broker-payment-success`);
    successUrl.searchParams.set('application_id', applicationId);
    successUrl.searchParams.set('tracking_id', trackingId);
    
    // Add UTM parameters to success URL
    Object.entries(utmParams).forEach(([key, value]) => {
      if (value) {
        successUrl.searchParams.set(key, value as string);
      }
    });

    // Create a checkout session with the specific price ID
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: "price_1Rr3tyFpL5FAW1TUbwSTqPxJ",
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: successUrl.toString(),
      cancel_url: `${origin}/broker-signup`,
      allow_promotion_codes: true,
      customer_email: application.applicant_email,
      payment_intent_data: {
        metadata: {
          type: application.application_type === 'client' ? "client_trial" : "broker_trial",
          application_id: applicationId,
          tracking_id: trackingId,
          applicant_email: application.applicant_email,
          company_name: application.company_name,
          application_type: application.application_type,
        },
      },
      metadata: {
        application_id: applicationId,
        tracking_id: trackingId,
      },
    });

    // Update application with Stripe session ID
    const { error: updateError } = await supabaseClient
      .from('lender_broker_applications')
      .update({
        stripe_payment_link_id: session.id,
        admin_notes: application.admin_notes + ` | Stripe Session: ${session.id}`
      })
      .eq('id', applicationId);

    if (updateError) {
      console.error('Error updating application:', updateError);
    }

    return new Response(JSON.stringify({ url: session.url, session_id: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});