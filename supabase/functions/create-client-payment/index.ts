import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentRequest {
  clientId: string;
  amount: number;
  description?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientId, amount, description = "Lead Simulation Access" }: PaymentRequest = await req.json();

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

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_API_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ 
      email: client.email, 
      limit: 1 
    });
    
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Create payment link
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: description,
            },
            unit_amount: amount, // Amount in cents
          },
          quantity: 1,
        },
      ],
      payment_method_types: ["card"],
      customer: customerId,
      customer_creation: customerId ? undefined : "always",
      after_completion: {
        type: "redirect",
        redirect: {
          url: `${req.headers.get("origin")}/payment-success?client_id=${clientId}`,
        },
      },
      metadata: {
        client_id: clientId,
      },
    });

    // Update client with payment link information
    const { error: updateError } = await supabaseClient
      .from('clients')
      .update({
        stripe_payment_link_id: paymentLink.id,
        payment_status: 'waiting_payment',
      })
      .eq('id', clientId);

    if (updateError) {
      console.error("Error updating client:", updateError);
    }

    return new Response(
      JSON.stringify({ 
        paymentUrl: paymentLink.url,
        paymentLinkId: paymentLink.id 
      }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error creating payment:", error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});