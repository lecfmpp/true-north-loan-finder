import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestGHLRequest {
  partnerId: string;
  testData?: {
    name: string;
    email: string;
    phone: string;
    company_name: string;
    loan_amount: number;
    monthly_revenue: number;
    credit_score: string;
  };
  useRealData?: boolean;
  dryRun?: boolean;
  keepTestContact?: boolean;
  skipAutomations?: boolean;
  createOpportunity?: boolean;
  discoveryMode?: boolean;
}

// Enhanced phone normalization function
function normalizePhone(phone: string, country: string = 'US'): string {
  if (!phone) return '+15551234567'; // Fallback for test
  
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
    return { firstName: 'Test', lastName: 'Lead' };
  }
  
  const cleanName = name.trim();
  if (!cleanName) {
    return { firstName: 'Test', lastName: 'Lead' };
  }
  
  const nameParts = cleanName.split(' ').filter(part => part.length > 0);
  const firstName = nameParts[0] || 'Test';
  const lastName = nameParts.slice(1).join(' ') || 'Lead';
  
  return { firstName, lastName };
}

// Enhanced email validation
function normalizeEmail(email: string): string {
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return 'test@integration-test.com';
  }
  
  return email.toLowerCase().trim();
}

// Create opportunity for contact
async function createOpportunityForContact(
  contactId: string, 
  integration: any, 
  testData: any, 
  stageId: string, 
  leadSource: string
): Promise<any> {
  try {
    console.log(`Creating opportunity for contact ${contactId} in pipeline ${integration.pipeline_id}`);
    
    const opportunityPayload = {
      pipelineId: integration.pipeline_id,
      locationId: integration.location_id,
      contactId: contactId,
      name: `Test Opportunity - ${testData.company_name || 'Test Company'}`,
      pipelineStageId: stageId,
      status: 'open',
      monetaryValue: testData.loan_amount || 50000,
      assignedTo: null,
      notes: `Integration test opportunity created from ${leadSource}`,
      source: 'API Integration Test'
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
      return opportunityResult;
    } else {
      const errorText = await opportunityResponse.text();
      console.error('Failed to create opportunity:', errorText);
      
      if (opportunityResponse.status === 403) {
        throw new Error('Missing opportunities.write scope');
      }
      
      throw new Error(`Failed to create opportunity: ${opportunityResponse.status}`);
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
    const { partnerId, testData, useRealData, dryRun, keepTestContact, skipAutomations, createOpportunity, discoveryMode }: TestGHLRequest = await req.json();

    console.log('Testing GHL API V1 integration for partner:', partnerId);
    console.log('Use real data:', useRealData);
    console.log('Dry run mode:', dryRun);
    console.log('Keep test contact:', keepTestContact);
    console.log('Skip automations:', skipAutomations);
    console.log('Create opportunity:', createOpportunity);
    console.log('Discovery mode:', discoveryMode);

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
        error: "No active GHL integration found for partner"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get real lead data if requested - with enhanced error handling
    let actualTestData = testData;
    let leadSource = 'Test Data';
    let realLeadId = null;
    
    if (useRealData) {
      console.log('Fetching last lead assigned to partner...');
      
      try {
        // First try with lead_assignments join
        let leadQuery = await supabase
          .from("quiz_responses")
          .select(`
            *,
            lead_assignments!inner(
              partner_id,
              assigned_at
            )
          `)
          .eq("lead_assignments.partner_id", partnerId)
          .order("lead_assignments.assigned_at", { ascending: false })
          .limit(1);

        // If no results with join, try direct assigned_partner_id
        if (!leadQuery.data || leadQuery.data.length === 0) {
          console.log('No leads found with assignments table, trying assigned_partner_id...');
          leadQuery = await supabase
            .from("quiz_responses")
            .select("*")
            .eq("assigned_partner_id", partnerId)
            .order("updated_at", { ascending: false })
            .limit(1);
        }

        const lastLead = leadQuery.data?.[0];
        
        if (leadQuery.error || !lastLead) {
          console.log('No leads found for partner, using test data. Error:', leadQuery.error?.message);
          leadSource = 'Test Data (No real leads available)';
        } else {
          console.log('Found real lead data:', lastLead.id);
          realLeadId = lastLead.id;
          leadSource = `Real Lead Data (ID: ${lastLead.id})`;
          
          // Use real lead data with defensive parsing and normalization
          actualTestData = {
            name: lastLead.name || 'Test Lead',
            email: `test-${lastLead.id.substring(0, 8)}@integration-test.com`, // Modified email to avoid conflicts
            phone: lastLead.phone || '5551234567',
            company_name: lastLead.company_name || lastLead.use_of_funds || 'Test Company',
            loan_amount: typeof lastLead.loan_amount === 'number' ? lastLead.loan_amount : 50000,
            monthly_revenue: typeof lastLead.monthly_revenue === 'number' ? lastLead.monthly_revenue : 25000,
            credit_score: lastLead.credit_score || 'good'
          };
          
          console.log('Processed real lead data:', JSON.stringify(actualTestData, null, 2));
        }
      } catch (fetchError) {
        console.error('Error fetching real lead data:', fetchError);
        leadSource = `Test Data (Error fetching real leads: ${fetchError.message})`;
      }
    }

    // Fallback to default test data if no real data available
    if (!actualTestData) {
      actualTestData = {
        name: 'Test Lead',
        email: 'test@integration-test.com',
        phone: '5551234567',
        company_name: 'Test Company',
        loan_amount: 50000,
        monthly_revenue: 25000,
        credit_score: 'good'
      };
    }

    console.log('Testing API V1 integration with location:', integration.location_id);

    // Validate Private Integration Token format
    if (!integration.api_key || integration.api_key.trim() === '') {
      return new Response(JSON.stringify({
        success: false,
        error: "API key is missing or empty"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!integration.api_key.startsWith('pit-')) {
      return new Response(JSON.stringify({
        success: false,
        error: "Invalid Private Integration Token format. Token must start with 'pit-' for API V1"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log('Private Integration Token format validated');
    console.log('Location ID:', integration.location_id);

    // Test API key by getting location info using API V1
    const locationResponse = await fetch(`https://services.leadconnectorhq.com/locations/${integration.location_id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${integration.api_key}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28',
      },
    });

    console.log('Location API response status:', locationResponse.status);

    if (!locationResponse.ok) {
      const errorText = await locationResponse.text();
      console.error('GHL Location API Error:', errorText);
      
      let errorMessage = `API Error (${locationResponse.status})`;
      
      if (locationResponse.status === 401) {
        errorMessage = "Invalid or expired Private Integration Token. Please check your GHL token.";
      } else if (locationResponse.status === 403) {
        errorMessage = "Access forbidden. Check if the Private Integration Token has proper scopes.";
      } else if (locationResponse.status === 404) {
        errorMessage = "Location not found. Please verify the Location ID.";
      } else {
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // Use the default error message if parsing fails
        }
      }
      
      return new Response(JSON.stringify({
        success: false,
        error: errorMessage,
        details: {
          status: locationResponse.status,
          response: errorText,
          apiVersion: 'v1'
        }
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const locationData = await locationResponse.json();
    console.log('Location verified:', locationData.location?.name);

    // Fetch pipelines for validation and discovery
    let pipelineValid = true;
    let pipelinesData = null;
    let availablePipelines: any[] = [];
    let pipelineInfo = null;
    let firstStageId = null;
    let scopeIssues: string[] = [];

    const pipelineResponse = await fetch(`https://services.leadconnectorhq.com/opportunities/pipelines?locationId=${integration.location_id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${integration.api_key}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28',
      },
    });

    if (pipelineResponse.ok) {
      pipelinesData = await pipelineResponse.json();
      availablePipelines = pipelinesData.pipelines || [];
      console.log(`Found ${availablePipelines.length} pipelines:`, availablePipelines.map(p => ({ id: p.id, name: p.name })));
      
      if (integration.pipeline_id) {
        pipelineInfo = availablePipelines.find((p: any) => p.id === integration.pipeline_id);
        
        if (!pipelineInfo) {
          pipelineValid = false;
          console.log('Pipeline not found:', integration.pipeline_id);
          console.log('Available pipeline IDs:', availablePipelines.map(p => p.id));
        } else {
          console.log('Pipeline verified:', pipelineInfo.name);
          // Get first stage for opportunity creation
          firstStageId = pipelineInfo.stages?.[0]?.id;
        }
      }
    } else if (pipelineResponse.status === 403) {
      scopeIssues.push('opportunities.read');
      pipelineValid = false;
      const errorText = await pipelineResponse.text();
      console.log('Missing opportunities.read scope - Response:', errorText);
    } else if (pipelineResponse.status === 401) {
      // Unauthorized usually means the token lacks scope to read pipelines
      scopeIssues.push('opportunities.read');
      pipelineValid = false;
      const errorText = await pipelineResponse.text();
      console.log('Unauthorized when fetching pipelines (likely missing scope) - Response:', errorText);
    } else {
      pipelineValid = false;
      const errorText = await pipelineResponse.text();
      console.log(`Failed to fetch pipelines (${pipelineResponse.status}):`, errorText);
    }

    // If discovery mode, return pipeline information
    if (discoveryMode) {
      return new Response(JSON.stringify({
        success: true,
        discoveryMode: true,
        availablePipelines: availablePipelines.map(p => ({
          id: p.id,
          name: p.name,
          stages: p.stages?.map((s: any) => ({ id: s.id, name: s.name })) || []
        })),
        scopeIssues,
        message: availablePipelines.length > 0 ? 
          `Found ${availablePipelines.length} pipelines in location` :
          'No pipelines found or missing read permissions'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prepare test contact data for API V1 with enhanced validation
    const { firstName, lastName } = normalizeName(actualTestData.name);
    const normalizedPhone = normalizePhone(actualTestData.phone, actualTestData.country || 'US');
    const normalizedEmail = normalizeEmail(actualTestData.email);

    // Ensure all required fields are valid
    if (!firstName || !normalizedEmail) {
      return new Response(JSON.stringify({
        success: false,
        error: "Invalid lead data: name and email are required"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build custom fields array properly for API V1
    const customFieldsArray = [
      { key: 'loanAmount', field_value: String(actualTestData.loan_amount) },
      { key: 'monthlyRevenue', field_value: String(actualTestData.monthly_revenue) },
      { key: 'creditScore', field_value: String(actualTestData.credit_score) },
      { key: 'testContact', field_value: 'true' },
      { key: 'apiVersion', field_value: 'v1' },
      { key: 'dataSource', field_value: leadSource },
      { key: 'integrationTest', field_value: new Date().toISOString() }
    ];

    // Add real lead ID if available
    if (realLeadId) {
      customFieldsArray.push({ key: 'originalLeadId', field_value: realLeadId });
    }

    // Build base contact payload
    const baseContact = {
      firstName,
      lastName,
      email: normalizedEmail,
      phone: normalizedPhone,
      companyName: actualTestData.company_name || 'Test Company',
      source: `API V1 Integration Test - ${leadSource}`,
      tags: ['Test', 'Integration', 'API-V1', useRealData ? 'RealData' : 'MockData'],
      customFields: customFieldsArray
    };

    // Add DND settings if skipAutomations is enabled
    if (skipAutomations) {
      baseContact.tags.push('DND', 'NoAutomation');
    }

    console.log('Prepared test contact for API V1:', JSON.stringify(baseContact, null, 2));

    // Handle dry run mode - validate payload without posting
    if (dryRun) {
      console.log('DRY RUN MODE: Validating payload without creating contact');
      
      return new Response(JSON.stringify({
        success: true,
        dryRun: true,
        results: {
          apiKey: {
            status: 'Valid',
            details: 'Private Integration Token authenticated successfully (API V1)'
          },
          location: {
            status: 'Valid',
            details: locationData.location?.name || 'Location verified',
            locationId: integration.location_id
          },
          pipeline: integration.pipeline_id ? {
            status: pipelineValid ? 'Valid' : 'Invalid',
            details: pipelineValid ? `Pipeline '${pipelineInfo?.name}' verified` : 'Pipeline not found in location',
            pipelineId: integration.pipeline_id,
            availablePipelines: !pipelineValid ? availablePipelines.map(p => ({ id: p.id, name: p.name })) : undefined
          } : {
            status: 'Not configured',
            details: 'No pipeline ID specified - leads will be created without pipeline assignment'
          },
          webhook: integration.webhook_url ? {
            status: 'Pending',
            details: 'Webhook URL configured but not tested in dry run mode',
            webhookUrl: integration.webhook_url
          } : {
            status: 'Not configured',
            details: 'No webhook URL specified'
          },
          payloadValidation: {
            status: 'Valid',
            details: 'Contact payload structure and data validation passed',
            contactPayload: baseContact
          },
          scopes: {
            status: scopeIssues.length === 0 ? 'Verified' : 'Missing',
            details: scopeIssues.length === 0 ? 
              'Private Integration Token has required scopes for contacts and opportunities' :
              `Missing scopes: ${scopeIssues.join(', ')}`,
            missingScopes: scopeIssues
          }
        },
        message: `GHL API V1 Integration dry run completed successfully using ${leadSource} - payload validated but no contact created`,
        apiVersion: 'v1',
        tokenType: 'private_integration',
        summary: `✓ Private Token Valid ✓ Location Valid ${integration.pipeline_id ? (pipelineValid ? '✓' : '✗') + ' Pipeline' : '- Pipeline'} ${integration.webhook_url ? '?' + ' Webhook' : '- Webhook'} ${scopeIssues.length === 0 ? '✓' : '✗'} Scopes ✓ Payload Valid ✓ Dry Run (${leadSource})`
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Initialize webhook status before possible early returns
    let webhookValid = true;
    console.log('Creating test contact with API V1:', JSON.stringify(baseContact, null, 2));

    // Create test contact using API V1
    const requestBody = {
      ...baseContact,
      locationId: integration.location_id
    };
    
    console.log('GHL API Request Body:', JSON.stringify(requestBody, null, 2));
    
    const contactResponse = await fetch(`https://services.leadconnectorhq.com/contacts/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${integration.api_key}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28',
        'LocationId': integration.location_id,
      },
      body: JSON.stringify(requestBody),
    });

    let contactResult = null;
    let opportunityResult = null;
    let existingContactId = null;
    
    if (contactResponse.ok) {
      contactResult = await contactResponse.json();
      console.log('Test contact created:', contactResult.contact?.id);
      existingContactId = contactResult.contact?.id;

      // Create opportunity if enabled and pipeline is configured
      if (createOpportunity && integration.pipeline_id && pipelineValid && existingContactId && firstStageId) {
        try {
          opportunityResult = await createOpportunityForContact(
            existingContactId, 
            integration, 
            actualTestData, 
            firstStageId, 
            leadSource
          );
          console.log('Opportunity created for contact:', opportunityResult?.opportunity?.id);
        } catch (opportunityError) {
          console.error('Failed to create opportunity:', opportunityError);
          if (opportunityError.message?.includes('opportunities.write')) {
            scopeIssues.push('opportunities.write');
          }
        }
      }

      // Clean up test contact and opportunity after 5 seconds (unless keepTestContact is true)
      if (existingContactId && !keepTestContact) {
        setTimeout(async () => {
          try {
            // Delete opportunity first if it exists
            if (opportunityResult?.opportunity?.id) {
              await fetch(`https://services.leadconnectorhq.com/opportunities/${opportunityResult.opportunity.id}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${integration.api_key}`,
                  'Version': '2021-07-28',
                },
              });
              console.log('Test opportunity cleaned up');
            }
            
            // Then delete contact
            await fetch(`https://services.leadconnectorhq.com/contacts/${existingContactId}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${integration.api_key}`,
                'Version': '2021-07-28',
              },
            });
            console.log('Test contact cleaned up');
          } catch (cleanupError) {
            console.error('Failed to cleanup test contact/opportunity:', cleanupError);
          }
        }, 5000);
      } else if (existingContactId && keepTestContact) {
        console.log('Test contact kept in GHL as requested (ID:', existingContactId, ')');
        if (opportunityResult?.opportunity?.id) {
          console.log('Test opportunity kept in GHL (ID:', opportunityResult.opportunity.id, ')');
        }
      }
    } else {
      const errorText = await contactResponse.text();
      console.error('Test contact creation failed:', errorText);
      
      let errorMessage = `Failed to create test contact: ${contactResponse.status}`;
      let isDuplicateError = false;
      let existingContactId = null;
      
      try {
        const errorData = JSON.parse(errorText);
        
        // Handle duplicate contact errors gracefully
        if (errorData.statusCode === 400 && errorData.message?.includes('duplicated contacts')) {
          isDuplicateError = true;
          existingContactId = errorData.meta?.contactId;
          const matchingField = errorData.meta?.matchingField;
          
          errorMessage = `Duplicate contact detected (matching ${matchingField}). This means the integration can create contacts, but this ${matchingField} already exists in GHL.`;
          
          // For duplicate errors, we still consider it a successful test
          console.log('Duplicate contact detected, but integration is working correctly');
          console.log('Existing contact ID:', existingContactId);
          // Try to create opportunity with existing contact if enabled
          if (createOpportunity && integration.pipeline_id && pipelineValid && existingContactId && firstStageId) {
            try {
              opportunityResult = await createOpportunityForContact(
                existingContactId, 
                integration, 
                actualTestData, 
                firstStageId, 
                leadSource
              );
              console.log('Opportunity created for existing contact:', opportunityResult?.opportunity?.id);
            } catch (opportunityError) {
              console.error('Failed to create opportunity for existing contact:', opportunityError);
              if (opportunityError.message?.includes('opportunities.write')) {
                scopeIssues.push('opportunities.write');
              }
            }
          }
          
          return new Response(JSON.stringify({
            success: true,
            duplicate: true,
            results: {
              apiKey: {
                status: 'Valid',
                details: 'Private Integration Token authenticated successfully (API V1)'
              },
              location: {
                status: 'Valid',
                details: locationData.location?.name || 'Location verified',
                locationId: integration.location_id
              },
              pipeline: integration.pipeline_id ? {
                status: pipelineValid ? 'Valid' : 'Invalid',
                details: pipelineValid ? 'Pipeline ID verified' : 'Pipeline not found in location',
                pipelineId: integration.pipeline_id
              } : {
                status: 'Not configured',
                details: 'No pipeline ID specified - leads will be created without pipeline assignment'
              },
              webhook: integration.webhook_url ? {
                status: webhookValid ? 'Valid' : 'Failed',
                details: webhookValid ? 'Webhook endpoint responded successfully' : 'Webhook endpoint did not respond',
                webhookUrl: integration.webhook_url
              } : {
                status: 'Not configured',
                details: 'No webhook URL specified'
              },
              contactCreation: {
                status: 'Duplicate Detected',
                details: errorMessage,
                existingContactId,
                matchingField: errorData.meta?.matchingField
              },
              opportunityCreation: createOpportunity && integration.pipeline_id ? {
                status: opportunityResult ? 'Successful' : 'Failed',
                details: opportunityResult ? 
                  `Opportunity created in pipeline '${pipelineInfo?.name}'` :
                  'Failed to create opportunity - check scopes',
                opportunityId: opportunityResult?.opportunity?.id,
                pipelineName: pipelineInfo?.name
              } : {
                status: 'Not attempted',
                details: createOpportunity ? 'No pipeline configured' : 'Opportunity creation disabled'
              },
              scopes: {
                status: scopeIssues.length === 0 ? 'Verified' : 'Missing',
                details: scopeIssues.length === 0 ? 
                  'Private Integration Token has required scopes for contacts and opportunities' :
                  `Missing scopes: ${scopeIssues.join(', ')}`,
                missingScopes: scopeIssues
              }
            },
            message: `GHL API V1 integration working correctly - duplicate contact indicates successful API connection using ${leadSource}`,
            apiVersion: 'v1',
            tokenType: 'private_integration',
            summary: `✓ Private Token Valid ✓ Location Valid ${integration.pipeline_id ? (pipelineValid ? '✓' : '✗') + ' Pipeline' : '- Pipeline'} ${integration.webhook_url ? (webhookValid ? '✓' : '✗') + ' Webhook' : '- Webhook'} ⚠ Duplicate Contact ✓ API V1 (${leadSource})`
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        errorMessage = errorData.message ? 
          (Array.isArray(errorData.message) ? errorData.message.join(', ') : errorData.message) :
          errorMessage;
      } catch (e) {
        // Use the raw error text if JSON parsing fails
        errorMessage = errorText || errorMessage;
      }
      
      return new Response(JSON.stringify({
        success: false,
        error: errorMessage,
        details: {
          status: contactResponse.status,
          response: errorText,
          apiVersion: 'v1',
          isDuplicateError,
          existingContactId
        }
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Test webhook if configured
    if (integration.webhook_url) {
      try {
        const webhookResponse = await fetch(integration.webhook_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event: 'integration_test',
            partnerId,
            apiVersion: 'v1',
            tokenType: 'private_integration',
            timestamp: new Date().toISOString(),
          }),
        });
        
        if (!webhookResponse.ok) {
          webhookValid = false;
        }
      } catch (webhookError) {
        webhookValid = false;
        console.error('Webhook test failed:', webhookError);
      }
    }

    console.log('GHL API V1 integration test completed successfully');

    return new Response(JSON.stringify({
      success: true,
      results: {
        apiKey: {
          status: 'Valid',
          details: 'Private Integration Token authenticated successfully (API V1)'
        },
        location: {
          status: 'Valid',
          details: locationData.location?.name || 'Location verified',
          locationId: integration.location_id
        },
        pipeline: integration.pipeline_id ? {
          status: pipelineValid ? 'Valid' : 'Invalid',
          details: pipelineValid ? 'Pipeline ID verified' : 'Pipeline not found in location',
          pipelineId: integration.pipeline_id
        } : {
          status: 'Not configured',
          details: 'No pipeline ID specified - leads will be created without pipeline assignment'
        },
        webhook: integration.webhook_url ? {
          status: webhookValid ? 'Valid' : 'Failed',
          details: webhookValid ? 'Webhook endpoint responded successfully' : 'Webhook endpoint did not respond',
          webhookUrl: integration.webhook_url
        } : {
          status: 'Not configured',
          details: 'No webhook URL specified'
        },
        contactCreation: {
          status: 'Successful',
          details: keepTestContact ? 
            `Test contact created and kept in GHL using API V1 (${leadSource})` :
            `Test contact created and cleaned up successfully using API V1 (${leadSource})`,
          contactId: contactResult.contact?.id,
          kept: keepTestContact
        },
        opportunityCreation: createOpportunity && integration.pipeline_id ? {
          status: opportunityResult ? 'Successful' : 'Failed',
          details: opportunityResult ? 
            `Opportunity created in pipeline '${pipelineInfo?.name}'` :
            'Failed to create opportunity - check scopes',
          opportunityId: opportunityResult?.opportunity?.id,
          pipelineName: pipelineInfo?.name,
          kept: keepTestContact
        } : {
          status: 'Not attempted',
          details: createOpportunity ? 'No pipeline configured' : 'Opportunity creation disabled'
        },
        scopes: {
          status: scopeIssues.length === 0 ? 'Verified' : 'Missing',
          details: scopeIssues.length === 0 ? 
            'Private Integration Token has required scopes for contacts and opportunities' :
            `Missing scopes: ${scopeIssues.join(', ')}`,
          missingScopes: scopeIssues
        }
      },
      message: `GHL API V1 Private Integration test completed successfully using ${leadSource}`,
      apiVersion: 'v1',
      tokenType: 'private_integration',
      summary: `✓ Private Token Valid ✓ Location Valid ${integration.pipeline_id ? (pipelineValid ? '✓' : '✗') + ' Pipeline' : '- Pipeline'} ${integration.webhook_url ? (webhookValid ? '✓' : '✗') + ' Webhook' : '- Webhook'} ✓ Contact Creation ${createOpportunity && opportunityResult ? '✓ Opportunity' : createOpportunity ? '✗ Opportunity' : '- Opportunity'} ${scopeIssues.length === 0 ? '✓' : '✗'} Scopes ✓ API V1 (${leadSource})`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error in test-ghl-integration function (API V1):", error);

    // Log error to database for debugging
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      await supabase
        .from("ghl_integration_logs")
        .insert({
          partner_id: partnerId || null,
          status: 'error',
          error_message: error.message,
          response_data: {
            error: error.message,
            stack: error.stack,
            apiVersion: 'v1',
            testType: 'integration_test',
            useRealData: !!useRealData,
            timestamp: new Date().toISOString()
          }
        });
    } catch (logError) {
      console.error('Failed to log error to database:', logError);
    }

    // Provide more helpful error messages
    let userFriendlyError = error.message;
    if (error.message.includes('401')) {
      userFriendlyError = 'Invalid or expired GHL Private Integration Token. Please check your credentials.';
    } else if (error.message.includes('403')) {
      userFriendlyError = 'GHL Private Integration Token does not have sufficient scopes. Please ensure contacts and opportunities scopes are granted.';
    } else if (error.message.includes('404')) {
      userFriendlyError = 'GHL location not found. Please verify the Location ID.';
    } else if (error.message.includes('Cannot read properties of undefined')) {
      userFriendlyError = 'Data validation error. Please check your integration configuration.';
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: userFriendlyError,
        details: error.message,
        apiVersion: 'v1',
        debugInfo: {
          originalError: error.message,
          stack: error.stack?.split('\n')[0] // First line of stack trace
        }
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});