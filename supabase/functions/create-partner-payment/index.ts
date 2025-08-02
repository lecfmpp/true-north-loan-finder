import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

interface PaymentRequest {
  leadPackageCount: number;
  partnerId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Create partner payment function called');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const { leadPackageCount, partnerId }: PaymentRequest = await req.json();
    console.log('Payment request:', { leadPackageCount, partnerId, userId: user.id });

    // Get current lead pricing
    const { data: pricing, error: pricingError } = await supabaseClient
      .from('lead_pricing')
      .select('price_per_lead')
      .eq('is_active', true)
      .single();

    if (pricingError || !pricing) {
      console.error('Error fetching pricing:', pricingError);
      return new Response(JSON.stringify({ error: 'Failed to fetch pricing' }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    // Get partner information - remove user_id filter since partners are managed by admin
    const { data: partner, error: partnerError } = await supabaseClient
      .from('partners')
      .select('*')
      .eq('id', partnerId)
      .single();

    if (partnerError || !partner) {
      console.error('Error fetching partner:', partnerError);
      return new Response(JSON.stringify({ error: 'Partner not found or unauthorized' }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    console.log('Partner found:', { partnerId, email: partner.email, name: partner.name });

    // Calculate total amount
    const totalAmount = pricing.price_per_lead * leadPackageCount;
    
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ 
      email: partner.email, 
      limit: 1 
    });
    
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log('Existing customer found:', customerId);
    } else {
      // Create new customer
      const customer = await stripe.customers.create({
        email: partner.email,
        name: partner.name,
        metadata: {
          partner_id: partnerId,
          user_id: user.id,
          company_name: partner.company_name
        }
      });
      customerId = customer.id;
      console.log('New customer created:', customerId);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { 
              name: `Lead Package - ${leadPackageCount} leads`,
              description: `Purchase ${leadPackageCount} leads for your partner account`
            },
            unit_amount: pricing.price_per_lead,
          },
          quantity: leadPackageCount,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/admin?payment=success&leads=${leadPackageCount}`,
      cancel_url: `${req.headers.get("origin")}/admin?payment=cancelled`,
      metadata: {
        partner_id: partnerId,
        user_id: user.id,
        lead_count: leadPackageCount.toString(),
        price_per_lead: pricing.price_per_lead.toString()
      }
    });

    console.log('Checkout session created:', session.id);

    // Record payment intent in database
    const { error: recordError } = await supabaseClient
      .from('payment_records')
      .insert({
        user_id: user.id,
        amount: totalAmount,
        leads_purchased: leadPackageCount,
        stripe_session_id: session.id,
        status: 'pending',
        payment_type: 'lead_credits',
        metadata: {
          partner_id: partnerId,
          price_per_lead: pricing.price_per_lead,
          session_url: session.url
        }
      });

    if (recordError) {
      console.error('Error recording payment:', recordError);
      // Don't fail the payment creation, just log the error
    }

    return new Response(JSON.stringify({ 
      url: session.url,
      sessionId: session.id,
      amount: totalAmount,
      leadCount: leadPackageCount
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error('Error in create-partner-payment function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error: ' + error.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});