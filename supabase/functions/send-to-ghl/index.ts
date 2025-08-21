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

    console.log('Sending lead to GHL with API V1:', { partnerId, quizResponseId });

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

    console.log('Found GHL integration for location:', integration.location_id);

    // Validate Private Integration Token format
    if (!integration.api_key || !integration.api_key.startsWith('pit-')) {
      throw new Error("Invalid GHL Private Integration Token format. Token must start with 'pit-'");
    }

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

    // Normalize phone number with country context
    const normalizedPhone = normalizePhone(leadData.phone, leadData.country);

    // Prepare GHL contact data for API V1
    const ghlContact: GHLContact = {
      firstName,
      lastName: lastName || undefined,
      email: leadData.email,
      phone: normalizedPhone,
      companyName: leadData.company_name,
      source: 'Lead Management System',
      tags: ['Lead', 'Business Loan'],
      customFields: {}
    };

    // Map custom fields based on configuration
    Object.entries(fieldMappings).forEach(([sourceField, ghlField]) => {
      if (leadData[sourceField as keyof typeof leadData] !== undefined) {
        const value = leadData[sourceField as keyof typeof leadData];
        if (ghlField && ghlField.startsWith('custom_')) {
          ghlContact.customFields![ghlField] = value;
        } else if (ghlField && ['firstName', 'lastName', 'email', 'phone', 'companyName'].includes(ghlField)) {
          (ghlContact as any)[ghlField] = value;
        }
      }
    });

    // Convert custom fields to API V1 format (array of objects) - Enhanced validation
    const customFieldsArray = [];
    
    // Add mapped custom fields with validation
    Object.entries(ghlContact.customFields || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        // Ensure key is valid (no spaces, special chars)
        const sanitizedKey = String(key).replace(/[^a-zA-Z0-9_]/g, '_');
        const sanitizedValue = String(value).slice(0, 255); // Limit field value length
        customFieldsArray.push({ key: sanitizedKey, field_value: sanitizedValue });
      }
    });
    
    // Add additional lead data as custom fields with enhanced validation
    const additionalFields = {
      loanAmount: leadData.loan_amount?.toString(),
      monthlyRevenue: leadData.monthly_revenue?.toString(),
      creditScore: leadData.credit_score,
      useOfFunds: leadData.use_of_funds,
      timeInBusiness: leadData.time_in_business,
      website: leadData.website,
      city: leadData.city_province,
      country: leadData.country,
      quizResponseId: quizResponseId,
      submissionDate: new Date().toISOString(),
      systemSource: 'LeadManagementSystem'
    };
    
    if (applicationData) {
      additionalFields.hasApplication = 'true';
      additionalFields.applicationSubmitted = new Date().toISOString();
    }

    if (documents && documents.length > 0) {
      additionalFields.documentsCount = documents.length.toString();
      additionalFields.hasDocuments = 'true';
    }
    
    // Add fields with validation
    Object.entries(additionalFields).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        const sanitizedKey = String(key).replace(/[^a-zA-Z0-9_]/g, '_');
        const sanitizedValue = String(value).slice(0, 255); // Limit field value length
        customFieldsArray.push({ key: sanitizedKey, field_value: sanitizedValue });
      }
    });
    
    // Ensure customFields is always an array for API V1
    ghlContact.customFields = customFieldsArray;

    // Create contact notes with document information
    let contactNotes = `Lead submitted via Lead Management System
    
Business Details:
• Loan Amount: $${leadData.loan_amount?.toLocaleString()}
• Monthly Revenue: $${leadData.monthly_revenue?.toLocaleString()}
• Credit Score: ${leadData.credit_score}
• Use of Funds: ${leadData.use_of_funds}
• Time in Business: ${leadData.time_in_business}`;

    if (documents && documents.length > 0) {
      contactNotes += `\n\nDocuments Available:`;
      documents.forEach((doc, index) => {
        contactNotes += `\n• ${doc.name} (${doc.type})`;
      });
    }

    if (applicationData) {
      contactNotes += `\n\nApplication Data: Additional application details available in system`;
    }

    console.log('Creating contact in GHL with API V1:', { ...ghlContact, customFields: Object.keys(ghlContact.customFields || {}) });

    // Try to upsert contact (check if exists first by email)
    let contactResult = null;
    let isNewContact = true;

    try {
      // First, try to find existing contact by email using API V1
      const searchResponse = await fetch(`https://services.leadconnectorhq.com/contacts/search?email=${encodeURIComponent(leadData.email)}&locationId=${integration.location_id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${integration.api_key}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28',
        },
      });

      if (searchResponse.ok) {
        const searchResult = await searchResponse.json();
        if (searchResult.contacts && searchResult.contacts.length > 0) {
          isNewContact = false;
          const existingContact = searchResult.contacts[0];
          console.log('Found existing contact, updating:', existingContact.id);

          // Update existing contact using API V1
          const updateResponse = await fetch(`https://services.leadconnectorhq.com/contacts/${existingContact.id}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${integration.api_key}`,
              'Content-Type': 'application/json',
              'Version': '2021-07-28',
              'LocationId': integration.location_id,
            },
            body: JSON.stringify({
              ...ghlContact,
              locationId: integration.location_id,
            }),
          });

          if (updateResponse.ok) {
            contactResult = await updateResponse.json();
            console.log('GHL contact updated successfully:', contactResult.contact?.id);
          } else {
            throw new Error(`Failed to update contact: ${updateResponse.status}`);
          }
        }
      }
    } catch (searchError) {
      console.log('Contact search failed, proceeding with create:', searchError);
    }

    // If no existing contact found or search failed, create new contact using API V1
    if (!contactResult) {
      const createResponse = await fetch(`https://services.leadconnectorhq.com/contacts/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${integration.api_key}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28',
          'LocationId': integration.location_id,
        },
        body: JSON.stringify({
          ...ghlContact,
          locationId: integration.location_id,
        }),
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        console.error('GHL Contact API Error:', errorText);
        throw new Error(`Failed to create contact in GHL: ${createResponse.status} ${errorText}`);
      }

      contactResult = await createResponse.json();
      console.log('GHL contact created successfully:', contactResult.contact?.id);
    }

    // Add notes to the contact using API V1
    if (contactResult.contact?.id && contactNotes) {
      try {
        await fetch(`https://services.leadconnectorhq.com/contacts/${contactResult.contact.id}/notes`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${integration.api_key}`,
            'Content-Type': 'application/json',
            'Version': '2021-07-28',
          },
          body: JSON.stringify({
            body: contactNotes,
            userId: integration.location_id, // Use location as fallback user
          }),
        });
        console.log('Added notes to contact');
      } catch (noteError) {
        console.error('Failed to add notes to contact:', noteError);
        // Don't fail the main process for note errors
      }
    }

    let opportunityResult = null;

    // Create opportunity if pipeline is configured using API V1
    if (integration.pipeline_id && contactResult.contact?.id) {
      const opportunityCustomFields = [
        { key: 'loanAmount', field_value: leadData.loan_amount?.toString() || '' },
        { key: 'monthlyRevenue', field_value: leadData.monthly_revenue?.toString() || '' },
        { key: 'creditScore', field_value: leadData.credit_score || '' },
        { key: 'useOfFunds', field_value: leadData.use_of_funds || '' },
        { key: 'quizResponseId', field_value: quizResponseId || '' },
      ].filter(field => field.field_value !== '');

      const ghlOpportunity: GHLOpportunity = {
        title: `Business Loan - ${leadData.company_name || leadData.name}`,
        status: 'open',
        monetaryValue: leadData.loan_amount,
        pipelineId: integration.pipeline_id,
        contactId: contactResult.contact.id,
        customFields: opportunityCustomFields
      };

      console.log('Creating opportunity in GHL with API V1:', ghlOpportunity);

      const opportunityResponse = await fetch(`https://services.leadconnectorhq.com/opportunities/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${integration.api_key}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28',
          'LocationId': integration.location_id,
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
          isNewContact,
          documentsProvided: documents?.length || 0,
          applicationDataIncluded: !!applicationData,
          fieldMappingsUsed: Object.keys(fieldMappings).length,
          apiVersion: 'v1',
          tokenType: 'private_integration',
          ghlResponse: {
            contact: contactResult,
            opportunity: opportunityResult
          }
        }
      });

    console.log('GHL API V1 integration completed successfully');

    return new Response(JSON.stringify({
      success: true,
      contactId: contactResult.contact?.id,
      opportunityId: opportunityResult?.opportunity?.id,
      isNewContact,
      documentsCount: documents?.length || 0,
      apiVersion: 'v1',
      message: `Lead ${isNewContact ? 'created' : 'updated'} in Go High Level successfully using API V1 Private Integration`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error in send-to-ghl function (API V1):", error);

    // Log the error with more details
    try {
      const requestBody = await req.json();
      const { partnerId, quizResponseId } = requestBody;
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      await supabase
        .from("ghl_integration_logs")
        .insert({
          partner_id: partnerId || null,
          quiz_response_id: quizResponseId || null,
          status: 'error',
          error_message: error.message,
          response_data: { 
            error: error.message,
            stack: error.stack,
            apiVersion: 'v1',
            tokenType: 'private_integration',
            requestData: {
              hasLeadData: !!requestBody.leadData,
              hasApplicationData: !!requestBody.applicationData,
              documentsCount: requestBody.documents?.length || 0
            }
          }
        });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    // Provide more helpful error messages
    let userFriendlyError = error.message;
    if (error.message.includes('401')) {
      userFriendlyError = 'Invalid or expired GHL Private Integration Token. Please check your credentials.';
    } else if (error.message.includes('403')) {
      userFriendlyError = 'GHL Private Integration Token does not have sufficient scopes. Please ensure contacts and opportunities scopes are granted.';
    } else if (error.message.includes('404')) {
      userFriendlyError = 'GHL location not found. Please verify the Location ID.';
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: userFriendlyError,
        details: error.message,
        apiVersion: 'v1'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});