import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckPaymentRequest {
  clientId?: string;
  paymentLinkId?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientId, paymentLinkId }: CheckPaymentRequest = await req.json();

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_API_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    let client;
    if (clientId) {
      const { data, error } = await supabaseClient
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();
      
      if (error || !data) {
        throw new Error("Client not found");
      }
      client = data;
    } else if (paymentLinkId) {
      const { data, error } = await supabaseClient
        .from('clients')
        .select('*')
        .eq('stripe_payment_link_id', paymentLinkId)
        .single();
      
      if (error || !data) {
        throw new Error("Client not found");
      }
      client = data;
    } else {
      throw new Error("Either clientId or paymentLinkId is required");
    }

    if (!client.stripe_payment_link_id) {
      throw new Error("No payment link found for this client");
    }

    // Get payment sessions for this payment link
    const sessions = await stripe.checkout.sessions.list({
      payment_link: client.stripe_payment_link_id,
      limit: 10,
    });

    let isPaid = false;
    let sessionId = null;

    // Check if any session is completed
    for (const session of sessions.data) {
      if (session.payment_status === 'paid') {
        isPaid = true;
        sessionId = session.id;
        break;
      }
    }

    // Update client payment status if paid
    if (isPaid && client.payment_status !== 'paid') {
      const { error: updateError } = await supabaseClient
        .from('clients')
        .update({
          payment_status: 'paid',
          stripe_session_id: sessionId,
          payment_completed_at: new Date().toISOString(),
        })
        .eq('id', client.id);

      if (updateError) {
        console.error("Error updating client payment status:", updateError);
      }
    }

    return new Response(
      JSON.stringify({ 
        isPaid,
        paymentStatus: isPaid ? 'paid' : 'waiting_payment',
        sessionId,
        clientId: client.id
      }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error checking payment status:", error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});