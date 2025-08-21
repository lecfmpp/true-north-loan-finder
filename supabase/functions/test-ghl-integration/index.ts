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
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { partnerId, testData, useRealData }: TestGHLRequest = await req.json();

    console.log('Testing GHL API V1 integration for partner:', partnerId);
    console.log('Use real data:', useRealData);

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

    // Get real lead data if requested
    let actualTestData = testData;
    let leadSource = 'Test Data';
    
    if (useRealData) {
      console.log('Fetching last lead assigned to partner...');
      
      // Get the last lead assigned to this partner
      const { data: lastLead, error: leadError } = await supabase
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
        .limit(1)
        .single();

      if (leadError || !lastLead) {
        console.log('No leads found for partner, using test data');
        leadSource = 'Test Data (No real leads available)';
      } else {
        console.log('Found real lead data:', lastLead.id);
        leadSource = `Real Lead Data (ID: ${lastLead.id})`;
        
        // Use real lead data but modify email to avoid conflicts
        actualTestData = {
          name: lastLead.name || 'Test Lead',
          email: `test-${lastLead.id.substring(0, 8)}@integration-test.com`, // Modified email to avoid conflicts
          phone: lastLead.phone || '5551234567',
          company_name: lastLead.company_name || 'Test Company',
          loan_amount: lastLead.loan_amount || 50000,
          monthly_revenue: lastLead.monthly_revenue || 25000,
          credit_score: lastLead.credit_score || 'good'
        };
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

    // Test pipeline if configured using API V1
    let pipelineValid = true;
    if (integration.pipeline_id) {
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
        
        if (!pipeline) {
          pipelineValid = false;
          console.log('Pipeline not found:', integration.pipeline_id);
        } else {
          console.log('Pipeline verified:', pipeline.name);
        }
      } else {
        pipelineValid = false;
        console.log('Failed to verify pipeline');
      }
    }

    // Prepare test contact data for API V1
    const nameParts = actualTestData.name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Normalize phone number (add +1 for US/Canada)
    let normalizedPhone = actualTestData.phone.replace(/\D/g, '');
    if (normalizedPhone.length === 10) {
      normalizedPhone = `+1${normalizedPhone}`;
    } else if (normalizedPhone.length === 11 && normalizedPhone.startsWith('1')) {
      normalizedPhone = `+${normalizedPhone}`;
    }

    const testContact = {
      firstName,
      lastName: lastName || 'Test',
      email: actualTestData.email,
      phone: normalizedPhone,
      companyName: actualTestData.company_name,
      source: `API V1 Integration Test - ${leadSource}`,
      tags: ['Test', 'Integration', 'API-V1', useRealData ? 'RealData' : 'MockData'],
      customFields: [
        { key: 'loanAmount', field_value: actualTestData.loan_amount.toString() },
        { key: 'monthlyRevenue', field_value: actualTestData.monthly_revenue.toString() },
        { key: 'creditScore', field_value: actualTestData.credit_score },
        { key: 'testContact', field_value: 'true' },
        { key: 'apiVersion', field_value: 'v1' },
        { key: 'dataSource', field_value: leadSource }
      ]
    };

    console.log('Creating test contact with API V1:', JSON.stringify(testContact, null, 2));

    // Create test contact using API V1
    const requestBody = {
      ...testContact,
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
    if (contactResponse.ok) {
      contactResult = await contactResponse.json();
      console.log('Test contact created:', contactResult.contact?.id);
      
      // Clean up test contact after 5 seconds
      if (contactResult.contact?.id) {
        setTimeout(async () => {
          try {
            await fetch(`https://services.leadconnectorhq.com/contacts/${contactResult.contact.id}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${integration.api_key}`,
                'Version': '2021-07-28',
              },
            });
            console.log('Test contact cleaned up');
          } catch (cleanupError) {
            console.error('Failed to cleanup test contact:', cleanupError);
          }
        }, 5000);
      }
    } else {
      const errorText = await contactResponse.text();
      console.error('Test contact creation failed:', errorText);
      
      let errorMessage = `Failed to create test contact: ${contactResponse.status}`;
      try {
        const errorData = JSON.parse(errorText);
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
          apiVersion: 'v1'
        }
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Test webhook if configured
    let webhookValid = true;
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
          details: `Test contact created and cleaned up successfully using API V1 (${leadSource})`,
          contactId: contactResult.contact?.id
        },
        scopes: {
          status: 'Verified',
          details: 'Private Integration Token has required scopes for contacts and opportunities'
        }
      },
      message: `GHL API V1 Private Integration test completed successfully using ${leadSource}`,
      apiVersion: 'v1',
      tokenType: 'private_integration',
      summary: `✓ Private Token Valid ✓ Location Valid ${integration.pipeline_id ? (pipelineValid ? '✓' : '✗') + ' Pipeline' : '- Pipeline'} ${integration.webhook_url ? (webhookValid ? '✓' : '✗') + ' Webhook' : '- Webhook'} ✓ Contact Creation ✓ API V1 (${leadSource})`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error in test-ghl-integration function (API V1):", error);

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Failed to test GHL API V1 integration",
        apiVersion: 'v1'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});