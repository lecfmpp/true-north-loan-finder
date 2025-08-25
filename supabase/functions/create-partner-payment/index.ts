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

    // Get partner information by id or by user_id (some callers send user_id)
    let partner: any = null;

    // Try by partners.id first
    const { data: partnerById, error: partnerIdError } = await supabaseClient
      .from('partners')
      .select('*')
      .eq('id', partnerId)
      .single();

    if (partnerById) {
      partner = partnerById;
    } else {
      // Fallback: try by partners.user_id
      const { data: partnerByUser, error: partnerUserError } = await supabaseClient
        .from('partners')
        .select('*')
        .eq('user_id', partnerId)
        .single();

      if (partnerUserError || !partnerByUser) {
        console.error('Error fetching partner by id/user_id:', partnerId, partnerIdError, partnerUserError);
        return new Response(JSON.stringify({ error: 'Partner not found or unauthorized' }), {
          status: 404,
          headers: corsHeaders,
        });
      }
      partner = partnerByUser;
    }

    console.log('Partner found:', { partner_param: partnerId, partner_id: partner.id, email: partner.email, name: partner.name });

    // Calculate total amount
    const totalAmount = pricing.price_per_lead * leadPackageCount;
    
    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") || Deno.env.get("STRIPE_API_KEY") || "";
    if (!stripeKey) {
      console.error('Missing STRIPE_SECRET_KEY/STRIPE_API_KEY');
      return new Response(JSON.stringify({ error: 'Stripe secret key not configured' }), {
        status: 500,
        headers: corsHeaders,
      });
    }
    const stripe = new Stripe(stripeKey, {
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
            partner_id: partner.id,
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
        partner_id: partner.id,
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
          partner_id: partner.id,
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