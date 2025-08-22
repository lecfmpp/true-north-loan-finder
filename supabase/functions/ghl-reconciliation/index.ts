import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Find any existing opportunity for contact
async function findAnyOpportunityForContact(contactId: string, integration: any): Promise<any | null> {
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
    
    return allOpportunities.length > 0 ? allOpportunities[0] : null;
  } catch (e) {
    console.error('findAnyOpportunityForContact error:', e);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Starting GHL reconciliation job');

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Find leads with GHL contact but no opportunity
    const { data: leadsToReconcile, error: leadsError } = await supabase
      .from("quiz_responses")
      .select(`
        id,
        name,
        email,
        ghl_contact_id,
        ghl_opportunity_id,
        assigned_partner_id
      `)
      .not("ghl_contact_id", "is", null)
      .is("ghl_opportunity_id", null)
      .not("assigned_partner_id", "is", null)
      .limit(50); // Process in batches

    if (leadsError) {
      throw leadsError;
    }

    console.log(`📊 Found ${leadsToReconcile?.length || 0} leads to reconcile`);

    if (!leadsToReconcile || leadsToReconcile.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: "No leads need reconciliation",
        processed: 0
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = {
      processed: 0,
      attached: 0,
      errors: 0,
      details: [] as any[]
    };

    // Process each lead
    for (const lead of leadsToReconcile) {
      try {
        console.log(`🔍 Processing lead: ${lead.id} (${lead.name})`);
        results.processed++;

        // Get GHL integration for the partner
        const { data: integration, error: integrationError } = await supabase
          .from("ghl_integrations")
          .select("*")
          .eq("partner_id", lead.assigned_partner_id)
          .eq("is_active", true)
          .single();

        if (integrationError || !integration) {
          console.log(`❌ No active GHL integration for partner: ${lead.assigned_partner_id}`);
          results.errors++;
          results.details.push({
            leadId: lead.id,
            name: lead.name,
            status: 'error',
            error: 'No active GHL integration'
          });
          continue;
        }

        // Look for existing opportunities
        const existingOpp = await findAnyOpportunityForContact(lead.ghl_contact_id, integration);

        if (existingOpp) {
          console.log(`✅ Found opportunity ${existingOpp.id} for lead ${lead.id}`);

          // Update the lead record
          const { error: updateError } = await supabase
            .from("quiz_responses")
            .update({
              ghl_opportunity_id: existingOpp.id,
              updated_at: new Date().toISOString()
            })
            .eq("id", lead.id);

          if (updateError) {
            console.error(`❌ Failed to update lead ${lead.id}:`, updateError);
            results.errors++;
            results.details.push({
              leadId: lead.id,
              name: lead.name,
              status: 'error',
              error: 'Database update failed'
            });
            continue;
          }

          // Log the reconciliation activity
          await supabase.from('ghl_activity_logs').insert({
            lead_id: lead.id,
            partner_id: lead.assigned_partner_id,
            activity_type: 'opportunity_reconciled',
            status: 'success',
            ghl_contact_id: lead.ghl_contact_id,
            ghl_opportunity_id: existingOpp.id,
            details: {
              opportunityName: existingOpp.name,
              pipelineId: existingOpp.pipelineId,
              pipelineStageId: existingOpp.pipelineStageId,
              status: existingOpp.status,
              monetaryValue: existingOpp.monetaryValue,
              reconciliationType: 'nightly-job'
            }
          });

          results.attached++;
          results.details.push({
            leadId: lead.id,
            name: lead.name,
            status: 'attached',
            opportunityId: existingOpp.id,
            opportunityName: existingOpp.name
          });

        } else {
          console.log(`ℹ️ No opportunity found for lead ${lead.id}`);
          results.details.push({
            leadId: lead.id,
            name: lead.name,
            status: 'no_opportunity_found'
          });
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`💥 Error processing lead ${lead.id}:`, error);
        results.errors++;
        results.details.push({
          leadId: lead.id,
          name: lead.name,
          status: 'error',
          error: error.message
        });
      }
    }

    console.log('🏁 Reconciliation job completed:', results);

    return new Response(JSON.stringify({
      success: true,
      message: `Reconciliation completed: ${results.attached} opportunities attached, ${results.errors} errors`,
      ...results
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error('💥 Reconciliation job failed:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message || "Internal server error"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});