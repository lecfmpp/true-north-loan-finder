import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendLeadRequest {
  leadId: string;
  partnerId?: string;
  createOpportunity?: boolean;
  skipDuplicateCheck?: boolean;
}

// Enhanced phone normalization function
function normalizePhone(phone: string, country: string = 'US'): string {
  if (!phone) return '';
  
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // For US/Canada numbers, ensure they start with +1
  if (country === 'US' || country === 'CA') {
    if (digits.length === 10) {
      return `+1${digits}`;
    } else if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`;
    }
  }
  
  // For other countries, add + if not present
  return digits.startsWith('+') ? digits : `+${digits}`;
}

// Enhanced name validation and normalization
function normalizeName(name: string): { firstName: string; lastName: string } {
  if (!name || typeof name !== 'string') {
    return { firstName: 'Lead', lastName: 'Contact' };
  }
  
  const cleanName = name.trim();
  if (!cleanName) {
    return { firstName: 'Lead', lastName: 'Contact' };
  }
  
  const nameParts = cleanName.split(' ').filter(part => part.length > 0);
  const firstName = nameParts[0] || 'Lead';
  const lastName = nameParts.slice(1).join(' ') || 'Contact';
  
  return { firstName, lastName };
}

// Check if opportunity already exists for contact
async function checkExistingOpportunity(
  contactId: string,
  integration: any
): Promise<string | null> {
  try {
    const searchResponse = await fetch(`https://services.leadconnectorhq.com/opportunities/search?contactId=${contactId}&pipelineId=${integration.pipeline_id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${integration.api_key}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28',
      },
    });

    if (searchResponse.ok) {
      const searchResult = await searchResponse.json();
      if (searchResult.opportunities && searchResult.opportunities.length > 0) {
        const existingOpportunity = searchResult.opportunities[0];
        console.log('Found existing opportunity:', existingOpportunity.id);
        return existingOpportunity.id;
      }
    }
    return null;
  } catch (error) {
    console.log('Error checking existing opportunity:', error);
    return null;
  }
}
// Find any existing opportunity for contact (across all pipelines)
async function findAnyOpportunityForContact(contactId: string, integration: any): Promise<any | null> {
  try {
    const resp = await fetch(`https://services.leadconnectorhq.com/opportunities/search?contactId=${contactId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${integration.api_key}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28',
      },
    });
    if (resp.ok) {
      const json = await resp.json();
      const opp = json.opportunities?.[0] || null;
      if (opp) console.log('Found opportunity (any pipeline):', opp.id);
      return opp || null;
    }
  } catch (e) {
    console.log('findAnyOpportunityForContact error:', e);
  }
  return null;
}

// Move an opportunity to the target pipeline and stage
async function moveOpportunityToPipeline(opportunityId: string, integration: any, stageId: string): Promise<boolean> {
  try {
    const updatePayload = {
      pipelineId: integration.pipeline_id,
      pipelineStageId: stageId,
      status: 'open',
    };
    const resp = await fetch(`https://services.leadconnectorhq.com/opportunities/${opportunityId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${integration.api_key}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28',
      },
      body: JSON.stringify(updatePayload),
    });
    if (resp.ok) {
      console.log(`Moved opportunity ${opportunityId} to pipeline ${integration.pipeline_id} stage ${stageId}`);
      return true;
    } else {
      const err = await resp.json().catch(() => ({}));
      console.error('Failed to move opportunity:', err);
      return false;
    }
  } catch (e) {
    console.error('Error moving opportunity:', e);
    return false;
  }
}

// Create opportunity for contact
async function createOpportunityForContact(
  contactId: string, 
  integration: any, 
  leadData: any, 
  stageId: string
): Promise<any> {
  try {
    // Duplicate checking temporarily disabled - create opportunity directly
    console.log(`Creating new opportunity for contact ${contactId} in pipeline ${integration.pipeline_id}`);

    console.log(`Creating opportunity for contact ${contactId} in pipeline ${integration.pipeline_id}`);
    
    const opportunityPayload = {
      pipelineId: integration.pipeline_id,
      locationId: integration.location_id,
      contactId: contactId,
      name: `${leadData.company_name || leadData.name} - $${leadData.loan_amount?.toLocaleString() || '50,000'}`,
      pipelineStageId: stageId,
      status: 'open',
      monetaryValue: leadData.loan_amount || 50000,
      assignedTo: null,
      source: 'Lead Management System'
    };

    console.log('Creating opportunity with payload:', JSON.stringify(opportunityPayload, null, 2));

    const opportunityResponse = await fetch(`https://services.leadconnectorhq.com/opportunities/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${integration.api_key}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28',
      },
      body: JSON.stringify(opportunityPayload),
    });

    if (opportunityResponse.ok) {
      const opportunityResult = await opportunityResponse.json();
      console.log('Opportunity created successfully:', opportunityResult.opportunity?.id);
      return { ...opportunityResult, existing: false };
    } else {
      const errorResponse = await opportunityResponse.json().catch(() => ({}));
      console.error('Failed to create opportunity:', errorResponse);
      
      // Handle duplicate opportunity error gracefully
      if (opportunityResponse.status === 400 && (errorResponse.message?.includes('duplicate opportunity') || errorResponse.message?.toLowerCase?.().includes('duplicate'))) {
        console.log('Duplicate opportunity detected — locating existing opportunity for contact');
        const existing = await findAnyOpportunityForContact(contactId, integration);
        if (existing?.id) {
          const moved = await moveOpportunityToPipeline(existing.id, integration, stageId);
          return { opportunity: { id: existing.id }, existing: true, moved };
        }
      }

      throw new Error(`Failed to create opportunity: ${opportunityResponse.status} - ${errorResponse.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error creating opportunity:', error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { leadId, partnerId, createOpportunity = true, skipDuplicateCheck = false }: SendLeadRequest = await req.json();

    console.log('Sending lead to GHL:', leadId);
    console.log('Partner ID:', partnerId);
    console.log('Create opportunity:', createOpportunity);

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

    // Determine which partner integration to use
    let targetPartnerId = partnerId || leadData.assigned_partner_id;
    
    if (!targetPartnerId) {
      return new Response(JSON.stringify({
        success: false,
        error: "No partner assigned to this lead"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get GHL integration settings for the partner
    const { data: integration, error: integrationError } = await supabase
      .from("ghl_integrations")
      .select("*")
      .eq("partner_id", targetPartnerId)
      .eq("is_active", true)
      .single();

    if (integrationError || !integration) {
      return new Response(JSON.stringify({
        success: false,
        error: "No active GHL integration found for partner"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate integration settings
    if (!integration.api_key || !integration.location_id) {
      return new Response(JSON.stringify({
        success: false,
        error: "GHL integration is missing required configuration"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prepare contact data
    const { firstName, lastName } = normalizeName(leadData.name);
    const normalizedPhone = normalizePhone(leadData.phone, leadData.country || 'US');
    
    // Build custom fields array
    const customFieldsArray = [
      { key: 'loanAmount', field_value: String(leadData.loan_amount || '') },
      { key: 'monthlyRevenue', field_value: String(leadData.monthly_revenue || '') },
      { key: 'creditScore', field_value: String(leadData.credit_score || '') },
      { key: 'useOfFunds', field_value: String(leadData.use_of_funds || '') },
      { key: 'timeInBusiness', field_value: String(leadData.time_in_business || '') },
      { key: 'leadSource', field_value: 'Lead Management System' },
      { key: 'leadId', field_value: leadId },
      { key: 'submittedAt', field_value: leadData.created_at }
    ];

    // Add optional fields
    if (leadData.website) {
      customFieldsArray.push({ key: 'website', field_value: leadData.website });
    }
    if (leadData.city_province) {
      customFieldsArray.push({ key: 'location', field_value: leadData.city_province });
    }

    // Build contact payload
    const contactPayload = {
      firstName,
      lastName,
      email: leadData.email,
      phone: normalizedPhone,
      companyName: leadData.company_name || leadData.use_of_funds || 'Business',
      source: 'Lead Management System',
      tags: ['Lead Management', 'Production'],
      customFields: customFieldsArray,
      locationId: integration.location_id
    };

    console.log('Creating contact with payload:', JSON.stringify(contactPayload, null, 2));

    // Duplicate checking temporarily disabled - create contact directly
    let existingContactId = null;
    console.log('Skipping duplicate check - proceeding with contact creation');

    let contactId = existingContactId;
    let contactCreated = false;

    // Create contact if no duplicate found
    if (!existingContactId) {
      try {
        const contactResponse = await fetch(`https://services.leadconnectorhq.com/contacts/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${integration.api_key}`,
            'Content-Type': 'application/json',
            'Version': '2021-07-28',
          },
          body: JSON.stringify(contactPayload),
        });

        if (contactResponse.ok) {
          const contactResult = await contactResponse.json();
          contactId = contactResult.contact.id;
          contactCreated = true;
          console.log('Contact created successfully:', contactId);
        } else {
          const errorResponse = await contactResponse.json().catch(() => ({}));
          console.error('Failed to create contact:', errorResponse);
          
          // Check if it's a duplicate error with contactId in response
          if (errorResponse.meta?.contactId) {
            console.log('Duplicate contact detected in error response, using existing contact:', errorResponse.meta.contactId);
            contactId = errorResponse.meta.contactId;
            contactCreated = false;
          } else {
            return new Response(JSON.stringify({
              success: false,
              error: `Failed to create contact: ${contactResponse.status} - ${errorResponse.message || 'Unknown error'}`,
              leadId,
              partnerId: targetPartnerId
            }), {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
      } catch (createError) {
        console.error('Contact creation error:', createError);
        return new Response(JSON.stringify({
          success: false,
          error: `Contact creation failed: ${createError.message}`,
          leadId,
          partnerId: targetPartnerId
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      console.log('Using existing contact:', existingContactId);
    }

    let opportunityResult = null;
    let opportunityCreated = false;

    // Create opportunity if requested and pipeline configured
    if (createOpportunity && integration.pipeline_id && contactId) {
      try {
        // Get pipeline stages to find the first stage
        const pipelineResponse = await fetch(`https://services.leadconnectorhq.com/opportunities/pipelines?locationId=${integration.location_id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${integration.api_key}`,
            'Content-Type': 'application/json',
            'Version': '2021-07-28',
          },
        });

        if (pipelineResponse.ok) {
          const pipelinesData = await pipelineResponse.json();
          const pipeline = pipelinesData.pipelines?.find((p: any) => p.id === integration.pipeline_id);
          
          if (pipeline && pipeline.stages?.length > 0) {
            const firstStageId = pipeline.stages[0].id;
            opportunityResult = await createOpportunityForContact(contactId, integration, leadData, firstStageId);
            opportunityCreated = true;
          } else {
            console.log('Pipeline not found or has no stages');
          }
        } else {
          console.log('Failed to fetch pipeline information');
        }
      } catch (opportunityError) {
        console.error('Failed to create opportunity:', opportunityError);
        // Continue - contact was created successfully even if opportunity failed
      }
    }

    // Update the lead record with GHL IDs
    const updateData: any = {
      ghl_contact_id: contactId,
      updated_at: new Date().toISOString()
    };

    if (opportunityResult?.opportunity?.id) {
      updateData.ghl_opportunity_id = opportunityResult.opportunity.id;
    }

    if (contactCreated) {
      updateData.status = 'sent_to_ghl';
      updateData.conversion_status = 'ghl_contact_created';
    }

    await supabase
      .from("quiz_responses")
      .update(updateData)
      .eq("id", leadId);

    console.log('Lead processing completed successfully');

    return new Response(JSON.stringify({
      success: true,
      leadId,
      partnerId: targetPartnerId,
      contactId,
      contactCreated,
      opportunityId: opportunityResult?.opportunity?.id || null,
      opportunityCreated,
      existingContact: !!existingContactId,
      message: contactCreated 
        ? 'Lead sent to GHL successfully and contact created'
        : 'Lead processed - existing contact found and updated'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error('Error processing lead:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});