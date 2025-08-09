
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentRequest {
  clientId?: string;
  trackingId?: string;
  amount: number; // in cents
  description: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientId, trackingId, amount, description }: PaymentRequest = await req.json();

    if (!amount || amount <= 0) {
      throw new Error("Amount (in cents) is required");
    }

    if (!description) {
      throw new Error("Description is required");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Load client by id or trackingId
    let client: any = null;

    if (clientId) {
      const { data, error } = await supabaseClient
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .single();
      if (error) throw new Error(`Client lookup by ID failed: ${error.message}`);
      client = data;
    } else if (trackingId) {
      const { data, error } = await supabaseClient
        .from("clients")
        .select("*")
        .eq("tracking_id", trackingId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw new Error(`Client lookup by trackingId failed: ${error.message}`);
      if (!data) throw new Error("No client found for provided trackingId");
      client = data;
    } else {
      throw new Error("Either clientId or trackingId must be provided");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_API_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Find or create customer
    let customerId: string | undefined;
    if (client.email) {
      const customers = await stripe.customers.list({
        email: client.email,
        limit: 1,
      });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      }
    }
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: client.email || undefined,
        name: client.name || undefined,
      });
      customerId = customer.id;
    }

    const origin = req.headers.get("origin") || Deno.env.get("SUPABASE_URL") || "https://example.com";

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: description || "Lead Simulation Access",
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/broker-payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/broker-signup`,
      metadata: {
        client_id: client.id,
        tracking_id: trackingId ?? client.tracking_id ?? "",
        type: "client_payment",
      },
    });

    // Update client with payment session info
    await supabaseClient
      .from("clients")
      .update({
        stripe_payment_link_id: session.id,
        stripe_session_id: session.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", client.id);

    console.log("Payment session created successfully:", session.id);

    return new Response(
      JSON.stringify({
        success: true,
        paymentUrl: session.url,
        sessionId: session.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Error creating client payment:", error);
    return new Response(
      JSON.stringify({
        error: (error as Error).message,
        success: false,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
