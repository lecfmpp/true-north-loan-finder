import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";

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
    const body = await req.json().catch(() => ({}));
    const { partnerId } = body;
    
    if (!partnerId) {
      return new Response(JSON.stringify({
        success: false,
        error: "Partner ID is required"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    console.log('🔍 Debugging GHL integration for partner:', partnerId);
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get GHL integration settings
    const { data: integration, error: integrationError } = await supabase
      .from("ghl_integrations")
      .select("*")
      .eq("partner_id", partnerId)
      .eq("is_active", true)
      .single();

    if (integrationError || !integration) {
      return new Response(JSON.stringify({
        success: false,
        error: "No active GHL integration found",
        details: { integrationError, partnerId }
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log('📋 Integration found:', {
      partner_id: integration.partner_id,
      location_id: integration.location_id,
      pipeline_id: integration.pipeline_id,
      is_active: integration.is_active
    });

    // Test API connectivity
    console.log('🌐 Testing GHL API connectivity...');
    const testResponse = await fetch(`https://services.leadconnectorhq.com/locations/${integration.location_id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${integration.api_key}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28',
      },
    });

    const apiConnectivity = {
      status: testResponse.status,
      statusText: testResponse.statusText,
      ok: testResponse.ok
    };

    console.log('📡 API connectivity test result:', apiConnectivity);

    // Fetch pipelines
    console.log('📊 Fetching pipelines...');
    const pipelineResponse = await fetch(`https://services.leadconnectorhq.com/opportunities/pipelines?locationId=${integration.location_id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${integration.api_key}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28',
      },
    });

    let pipelinesInfo = {};
    let targetPipeline = null;

    if (pipelineResponse.ok) {
      const pipelinesData = await pipelineResponse.json();
      console.log('📈 Pipelines response:', pipelinesData);
      
      targetPipeline = pipelinesData.pipelines?.find((p: any) => p.id === integration.pipeline_id);
      
      pipelinesInfo = {
        total_pipelines: pipelinesData.pipelines?.length || 0,
        target_pipeline_found: !!targetPipeline,
        target_pipeline_details: targetPipeline ? {
          id: targetPipeline.id,
          name: targetPipeline.name,
          stages: targetPipeline.stages?.map((stage: any) => ({
            id: stage.id,
            name: stage.name,
            position: stage.position
          }))
        } : null,
        all_pipelines: pipelinesData.pipelines?.map((p: any) => ({
          id: p.id,
          name: p.name,
          stages_count: p.stages?.length || 0
        }))
      };
    } else {
      const errorText = await pipelineResponse.text();
      pipelinesInfo = {
        error: `Failed to fetch pipelines: ${pipelineResponse.status} - ${errorText}`
      };
    }

    console.log('🎭 Pipeline analysis:', pipelinesInfo);

    return new Response(JSON.stringify({
      success: true,
      integration: {
        partner_id: integration.partner_id,
        location_id: integration.location_id,
        pipeline_id: integration.pipeline_id,
        is_active: integration.is_active,
        has_api_key: !!integration.api_key
      },
      api_connectivity: apiConnectivity,
      pipelines: pipelinesInfo,
      recommendations: {
        can_create_opportunities: !!(targetPipeline && targetPipeline.stages?.length > 0),
        first_stage_id: targetPipeline?.stages?.[0]?.id,
        issues: [
          ...(apiConnectivity.ok ? [] : ['API connectivity failed']),
          ...(targetPipeline ? [] : [`Target pipeline ${integration.pipeline_id} not found`]),
          ...((targetPipeline?.stages?.length || 0) === 0 ? ['Target pipeline has no stages'] : [])
        ]
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error('💥 Debug error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});