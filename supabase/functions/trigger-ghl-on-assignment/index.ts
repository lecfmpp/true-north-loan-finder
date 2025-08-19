import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TriggerGHLRequest {
  quizResponseId: string;
  partnerId: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { quizResponseId, partnerId }: TriggerGHLRequest = await req.json();

    console.log('Triggering GHL integration for lead assignment:', { quizResponseId, partnerId });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check if partner has active GHL integration
    const { data: integration, error: integrationError } = await supabase
      .from("ghl_integrations")
      .select("*")
      .eq("partner_id", partnerId)
      .eq("is_active", true)
      .single();

    if (integrationError || !integration) {
      console.log('No active GHL integration found for partner:', partnerId);
      return new Response(JSON.stringify({
        success: false,
        message: 'No active GHL integration configured for partner'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get lead data
    const { data: leadData, error: leadError } = await supabase
      .from("quiz_responses")
      .select("*")
      .eq("id", quizResponseId)
      .single();

    if (leadError || !leadData) {
      throw new Error("Lead data not found");
    }

    console.log('Found lead data for GHL integration:', leadData.name);

    // Check for associated applications and documents
    let applicationData = null;
    let documents: Array<{name: string, url: string, type: string}> = [];

    // Check for USA application
    const { data: usaApp } = await supabase
      .from("usa_applications")
      .select("*")
      .eq("quiz_response_id", quizResponseId)
      .single();

    // Check for Canadian application
    const { data: canadianApp } = await supabase
      .from("canadian_applications")
      .select("*")
      .eq("quiz_response_id", quizResponseId)
      .single();

    // Use whichever application exists
    applicationData = usaApp || canadianApp || null;

    // Get documents from application if available
    if (applicationData?.document_files) {
      const docFiles = Array.isArray(applicationData.document_files) ? applicationData.document_files : [];
      
      for (const doc of docFiles) {
        if (doc.path) {
          const { data: signedUrlData } = await supabase.storage
            .from('application-documents')
            .createSignedUrl(doc.path, 3600); // 1 hour expiry

          if (signedUrlData?.signedUrl) {
            documents.push({
              name: doc.name || doc.path.split('/').pop() || 'document',
              url: signedUrlData.signedUrl,
              type: doc.type || 'application/octet-stream'
            });
          }
        }
      }
    }

    console.log(`Found ${documents.length} documents for GHL integration`);

    // Call the send-to-ghl function
    const { data: ghlResult, error: ghlError } = await supabase.functions.invoke('send-to-ghl', {
      body: {
        partnerId,
        quizResponseId,
        leadData: {
          name: leadData.name,
          email: leadData.email,
          phone: leadData.phone,
          company_name: leadData.company_name,
          loan_amount: leadData.loan_amount,
          monthly_revenue: leadData.monthly_revenue,
          credit_score: leadData.credit_score,
          use_of_funds: leadData.use_of_funds,
          time_in_business: leadData.time_in_business,
          website: leadData.website,
          city_province: leadData.city_province,
          country: leadData.country
        },
        applicationData,
        documents
      }
    });

    if (ghlError) {
      console.error('GHL integration failed:', ghlError);
      throw new Error(ghlError.message);
    }

    console.log('GHL integration completed successfully:', ghlResult);

    return new Response(JSON.stringify({
      success: true,
      message: 'Lead successfully sent to Go High Level',
      ghlResult
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error in trigger-ghl-on-assignment function:", error);

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Failed to trigger GHL integration" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});