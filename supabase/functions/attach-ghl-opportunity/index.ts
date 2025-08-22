import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AttachOpportunityRequest {
  leadId: string;
  opportunityId?: string;
  opportunityUrl?: string;
  autoFind?: boolean;
}

// Extract opportunity ID from GHL URL
function extractOpportunityId(url: string): string | null {
  const patterns = [
    /\/opportunities\/([a-zA-Z0-9_-]+)/,
    /opportunityId=([a-zA-Z0-9_-]+)/,
    /opportunity\/([a-zA-Z0-9_-]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

// Find opportunities for contact
async function findOpportunitiesForContact(contactId: string, integration: any): Promise<any[]> {
  try {
    let allOpportunities: any[] = [];
    let offset = 0;
    const limit = 20;
    
    while (true) {
      const resp = await fetch(`https://services.leadconnectorhq.com/opportunities/search?contactId=${contactId}&limit=${limit}&offset=${offset}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${integration.api_key}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28',
        },
      });
      
      if (!resp.ok) break;
      
      const json = await resp.json();
      const opportunities = json.opportunities || [];
      
      if (opportunities.length === 0) break;
      
      allOpportunities = [...allOpportunities, ...opportunities];
      
      if (opportunities.length < limit) break;
      offset += limit;
    }
    
    return allOpportunities;
  } catch (e) {
    console.error('Error finding opportunities:', e);
    return [];
  }
}

// Validate opportunity belongs to the correct location
async function validateOpportunity(opportunityId: string, integration: any): Promise<any | null> {
  try {
    const resp = await fetch(`https://services.leadconnectorhq.com/opportunities/${opportunityId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${integration.api_key}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28',
      },
    });
    
    if (!resp.ok) return null;
    
    const opportunity = await resp.json();
    
    // Validate it belongs to the correct location
    if (opportunity.locationId !== integration.location_id) {
      throw new Error('Opportunity belongs to a different GHL location');
    }
    
    return opportunity;
  } catch (e) {
    console.error('Error validating opportunity:', e);
    throw e;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { leadId, opportunityId, opportunityUrl, autoFind = false }: AttachOpportunityRequest = await req.json();

    console.log('Attaching GHL opportunity:', { leadId, opportunityId, opportunityUrl, autoFind });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get lead data
    const { data: leadData, error: leadError } = await supabase
      .from("quiz_responses")
      .select("*")
      .eq("id", leadId)
      .single();

    if (leadError || !leadData) {
      return new Response(JSON.stringify({
        success: false,
        error: "Lead not found"
      }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!leadData.assigned_partner_id) {
      return new Response(JSON.stringify({
        success: false,
        error: "Lead has no assigned partner"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!leadData.ghl_contact_id) {
      return new Response(JSON.stringify({
        success: false,
        error: "Lead must have a GHL contact first"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get GHL integration
    const { data: integration, error: integrationError } = await supabase
      .from("ghl_integrations")
      .select("*")
      .eq("partner_id", leadData.assigned_partner_id)
      .eq("is_active", true)
      .single();

    if (integrationError || !integration) {
      return new Response(JSON.stringify({
        success: false,
        error: "No active GHL integration found"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let targetOpportunityId = opportunityId;

    // Extract opportunity ID from URL if provided
    if (opportunityUrl && !opportunityId) {
      targetOpportunityId = extractOpportunityId(opportunityUrl);
      if (!targetOpportunityId) {
        return new Response(JSON.stringify({
          success: false,
          error: "Could not extract opportunity ID from URL"
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Auto-find opportunities if requested
    if (autoFind && !targetOpportunityId) {
      console.log('Auto-finding opportunities for contact:', leadData.ghl_contact_id);
      const opportunities = await findOpportunitiesForContact(leadData.ghl_contact_id, integration);
      
      if (opportunities.length === 0) {
        return new Response(JSON.stringify({
          success: false,
          error: "No opportunities found for this contact"
        }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Use the most recent opportunity
      targetOpportunityId = opportunities[0].id;
      console.log(`Found ${opportunities.length} opportunities, using: ${targetOpportunityId}`);
    }

    if (!targetOpportunityId) {
      return new Response(JSON.stringify({
        success: false,
        error: "No opportunity ID provided"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate the opportunity
    const opportunity = await validateOpportunity(targetOpportunityId, integration);
    if (!opportunity) {
      return new Response(JSON.stringify({
        success: false,
        error: "Opportunity not found or invalid"
      }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify it belongs to the correct contact
    if (opportunity.contactId !== leadData.ghl_contact_id) {
      return new Response(JSON.stringify({
        success: false,
        error: "Opportunity does not belong to this lead's contact"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update the lead with the opportunity ID
    const { error: updateError } = await supabase
      .from("quiz_responses")
      .update({
        ghl_opportunity_id: targetOpportunityId,
        updated_at: new Date().toISOString()
      })
      .eq("id", leadId);

    if (updateError) {
      throw updateError;
    }

    // Log the activity
    await supabase.from('ghl_activity_logs').insert({
      lead_id: leadId,
      partner_id: leadData.assigned_partner_id,
      activity_type: 'opportunity_attached',
      status: 'success',
      ghl_contact_id: leadData.ghl_contact_id,
      ghl_opportunity_id: targetOpportunityId,
      details: {
        opportunityName: opportunity.name,
        pipelineId: opportunity.pipelineId,
        pipelineStageId: opportunity.pipelineStageId,
        status: opportunity.status,
        monetaryValue: opportunity.monetaryValue,
        attachMethod: autoFind ? 'auto-find' : (opportunityUrl ? 'url' : 'id')
      }
    });

    console.log('Successfully attached opportunity:', targetOpportunityId);

    return new Response(JSON.stringify({
      success: true,
      message: "Opportunity attached successfully",
      opportunityId: targetOpportunityId,
      opportunityName: opportunity.name,
      pipelineId: opportunity.pipelineId
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error('Error attaching opportunity:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message || "Internal server error"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});