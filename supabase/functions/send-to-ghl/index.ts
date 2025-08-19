import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendToGHLRequest {
  partnerId: string;
  quizResponseId: string;
  leadData: {
    name: string;
    email: string;
    phone: string;
    company_name?: string;
    loan_amount: number;
    monthly_revenue: number;
    credit_score: string;
    use_of_funds: string;
    time_in_business: string;
    website?: string;
    city_province?: string;
    country?: string;
  };
  applicationData?: any;
  documents?: Array<{
    name: string;
    url: string;
    type: string;
  }>;
}

interface GHLContact {
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  companyName?: string;
  customFields?: Record<string, any>;
  tags?: string[];
  source?: string;
}

interface GHLOpportunity {
  title: string;
  status: string;
  monetaryValue?: number;
  pipelineId?: string;
  contactId: string;
  customFields?: Record<string, any>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { partnerId, quizResponseId, leadData, applicationData, documents }: SendToGHLRequest = await req.json();

    console.log('Sending lead to GHL:', { partnerId, quizResponseId });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get GHL integration settings for the partner
    const { data: integration, error: integrationError } = await supabase
      .from("ghl_integrations")
      .select("*")
      .eq("partner_id", partnerId)
      .eq("is_active", true)
      .single();

    if (integrationError || !integration) {
      throw new Error("No active GHL integration found for partner");
    }

    console.log('Found GHL integration for partner:', integration.location_id);

    // Parse field mappings or use defaults
    const fieldMappings = integration.field_mappings || {
      name: 'firstName',
      email: 'email',
      phone: 'phone',
      company_name: 'companyName',
      loan_amount: 'loanAmount',
      monthly_revenue: 'monthlyRevenue',
      credit_score: 'creditScore',
      use_of_funds: 'useOfFunds'
    };

    // Split name into first and last name
    const nameParts = leadData.name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Prepare GHL contact data
    const ghlContact: GHLContact = {
      firstName,
      lastName: lastName || undefined,
      email: leadData.email,
      phone: leadData.phone?.replace(/\D/g, ''), // Remove non-digits
      companyName: leadData.company_name,
      source: 'Lead Management System',
      tags: ['Lead', 'Business Loan'],
      customFields: {}
    };

    // Map custom fields based on configuration
    Object.entries(fieldMappings).forEach(([sourceField, ghlField]) => {
      if (leadData[sourceField as keyof typeof leadData] !== undefined) {
        const value = leadData[sourceField as keyof typeof leadData];
        if (ghlField.startsWith('custom_')) {
          ghlContact.customFields![ghlField] = value;
        } else {
          (ghlContact as any)[ghlField] = value;
        }
      }
    });

    // Add additional custom fields
    ghlContact.customFields = {
      ...ghlContact.customFields,
      loanAmount: leadData.loan_amount?.toString(),
      monthlyRevenue: leadData.monthly_revenue?.toString(),
      creditScore: leadData.credit_score,
      useOfFunds: leadData.use_of_funds,
      timeInBusiness: leadData.time_in_business,
      website: leadData.website,
      city: leadData.city_province,
      country: leadData.country,
      quizResponseId: quizResponseId,
      ...(applicationData && { hasApplication: 'true' })
    };

    console.log('Creating contact in GHL:', ghlContact);

    // Create contact in GHL
    const contactResponse = await fetch(`https://services.leadconnectorhq.com/contacts/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${integration.api_key}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28',
      },
      body: JSON.stringify({
        ...ghlContact,
        locationId: integration.location_id,
      }),
    });

    if (!contactResponse.ok) {
      const errorText = await contactResponse.text();
      console.error('GHL Contact API Error:', errorText);
      throw new Error(`Failed to create contact in GHL: ${contactResponse.status} ${errorText}`);
    }

    const contactResult = await contactResponse.json();
    console.log('GHL contact created successfully:', contactResult.contact?.id);

    let opportunityResult = null;

    // Create opportunity if pipeline is configured
    if (integration.pipeline_id && contactResult.contact?.id) {
      const ghlOpportunity: GHLOpportunity = {
        title: `Business Loan - ${leadData.company_name || leadData.name}`,
        status: 'open',
        monetaryValue: leadData.loan_amount,
        pipelineId: integration.pipeline_id,
        contactId: contactResult.contact.id,
        customFields: {
          loanAmount: leadData.loan_amount?.toString(),
          monthlyRevenue: leadData.monthly_revenue?.toString(),
          creditScore: leadData.credit_score,
          useOfFunds: leadData.use_of_funds,
          quizResponseId: quizResponseId,
        }
      };

      console.log('Creating opportunity in GHL:', ghlOpportunity);

      const opportunityResponse = await fetch(`https://services.leadconnectorhq.com/opportunities/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${integration.api_key}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28',
        },
        body: JSON.stringify({
          ...ghlOpportunity,
          locationId: integration.location_id,
        }),
      });

      if (opportunityResponse.ok) {
        opportunityResult = await opportunityResponse.json();
        console.log('GHL opportunity created successfully:', opportunityResult.opportunity?.id);
      } else {
        console.error('Failed to create opportunity in GHL:', await opportunityResponse.text());
      }
    }

    // Send webhook notification if configured
    if (integration.webhook_url) {
      try {
        await fetch(integration.webhook_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event: 'lead_sent_to_ghl',
            partnerId,
            quizResponseId,
            ghlContactId: contactResult.contact?.id,
            ghlOpportunityId: opportunityResult?.opportunity?.id,
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (webhookError) {
        console.error('Webhook notification failed:', webhookError);
        // Don't fail the main process for webhook errors
      }
    }

    // Log the integration activity
    await supabase
      .from("ghl_integration_logs")
      .insert({
        partner_id: partnerId,
        quiz_response_id: quizResponseId,
        status: 'success',
        response_data: {
          contactId: contactResult.contact?.id,
          opportunityId: opportunityResult?.opportunity?.id,
          ghlResponse: {
            contact: contactResult,
            opportunity: opportunityResult
          }
        }
      });

    console.log('GHL integration completed successfully');

    return new Response(JSON.stringify({
      success: true,
      contactId: contactResult.contact?.id,
      opportunityId: opportunityResult?.opportunity?.id,
      message: 'Lead sent to Go High Level successfully'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error in send-to-ghl function:", error);

    // Log the error
    try {
      const { partnerId, quizResponseId } = await req.json();
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      await supabase
        .from("ghl_integration_logs")
        .insert({
          partner_id: partnerId,
          quiz_response_id: quizResponseId,
          status: 'error',
          error_message: error.message,
          response_data: { error: error.message }
        });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Failed to send lead to GHL" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});