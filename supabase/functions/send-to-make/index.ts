import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface SendToMakeRequest {
  leadId: string
  eventType: 'lead_created' | 'partner_assigned' | 'application_submitted' | 'manual_send'
  overridePayload?: any
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify user authentication and superadmin role
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      throw new Error('Invalid authentication')
    }

    // Check if user is superadmin
    const { data: isSuperAdmin } = await supabase.rpc('is_superadmin', { 
      user_id_param: user.id 
    })
    
    if (!isSuperAdmin) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Superadmin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { leadId, eventType, overridePayload }: SendToMakeRequest = await req.json()

    if (!leadId || !eventType) {
      throw new Error('Missing required fields: leadId, eventType')
    }

    // Check if Make.com integration is enabled
    const { data: settings, error: settingsError } = await supabase
      .from('make_integration_settings')
      .select('enabled, event_toggles, webhook_url, field_mappings')
      .single()

    if (settingsError) {
      console.error('Failed to fetch Make settings:', settingsError)
      throw new Error('Failed to fetch integration settings')
    }

    if (!settings.enabled && eventType !== 'manual_send') {
      return new Response(
        JSON.stringify({ error: 'Make.com integration is disabled' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if specific event type is enabled (unless manual send)
    const eventToggles = settings.event_toggles || {}
    if (eventType !== 'manual_send' && !eventToggles[eventType]) {
      return new Response(
        JSON.stringify({ error: `Event type '${eventType}' is disabled` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch lead data with related information
    const { data: lead, error: leadError } = await supabase
      .from('quiz_responses')
      .select(`
        *,
        lead_assignments(
          partner_id,
          partners(id, name, email, company_name)
        )
      `)
      .eq('id', leadId)
      .single()

    if (leadError || !lead) {
      throw new Error('Lead not found')
    }

    // Fetch USA application data with attachments
    const { data: usaApplication } = await supabase
      .from('usa_applications')
      .select('application_reference_number, document_files, processing_statements')
      .eq('quiz_response_id', leadId)
      .single()

    // Fetch Canadian application data with attachments
    const { data: canadianApplication } = await supabase
      .from('canadian_applications')
      .select('application_reference_number, document_files, processing_statements')
      .eq('quiz_response_id', leadId)
      .single()

    // Get field mappings from settings
    const fieldMappings = settings.field_mappings || {}
    const leadFields = fieldMappings.lead_fields || {}
    const partnerFields = fieldMappings.partner_fields || {}
    const applicationFields = fieldMappings.application_fields || {}
    const metadataFields = fieldMappings.metadata_fields || {}

    // Helper function to filter object by field mappings
    const filterFields = (obj: any, mappings: Record<string, boolean>) => {
      const filtered: any = {}
      Object.keys(mappings).forEach(key => {
        if (mappings[key] && obj[key] !== undefined) {
          filtered[key] = obj[key]
        }
      })
      return filtered
    }

    // Build Make.com payload with selective field inclusion
    let payload = overridePayload

    if (!overridePayload) {
      // Build filtered lead data
      const filteredLead = filterFields(lead, leadFields)

      // Build filtered partner data
      let filteredPartner = null
      if (lead.lead_assignments?.[0]?.partners) {
        filteredPartner = filterFields(lead.lead_assignments[0].partners, partnerFields)
      }

      // Build application data with attachments if enabled
      const applications: any = {}
      
      if (applicationFields.usa_reference || applicationFields.include_attachments) {
        applications.usa = {
          exists: !!usaApplication
        }
        
        if (applicationFields.usa_reference) {
          applications.usa.reference = usaApplication?.application_reference_number || null
        }
        
        if (applicationFields.include_attachments && usaApplication) {
          applications.usa.attachments = {
            document_files: usaApplication.document_files || [],
            processing_statements: usaApplication.processing_statements || []
          }
        }
      }
      
      if (applicationFields.canadian_reference || applicationFields.include_attachments) {
        applications.canadian = {
          exists: !!canadianApplication
        }
        
        if (applicationFields.canadian_reference) {
          applications.canadian.reference = canadianApplication?.application_reference_number || null
        }
        
        if (applicationFields.include_attachments && canadianApplication) {
          applications.canadian.attachments = {
            document_files: canadianApplication.document_files || [],
            processing_statements: canadianApplication.processing_statements || []
          }
        }
      }

      // Build filtered metadata
      const potentialMetadata = {
        triggered_by_user_id: user.id,
        triggered_by_email: user.email,
        triggered_at: new Date().toISOString()
      }
      const filteredMetadata = filterFields(potentialMetadata, metadataFields)

      // Construct final payload
      payload = {
        event_type: eventType,
        idempotency_key: `${leadId}:${eventType}:${new Date().getTime()}`,
        lead: filteredLead,
        partner: filteredPartner,
        applications,
        metadata: filteredMetadata
      }
    }

    // Get webhook URL from settings table
    const webhookUrl = settings.webhook_url;
    if (!webhookUrl) {
      return new Response(
        JSON.stringify({ error: 'Make.com webhook URL not configured. Please set it in the Make.com Integration settings.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send to Make.com
    let httpStatus: number
    let responseData: any
    let errorMessage: string | null = null

    try {
      console.log('Sending payload to Make.com:', JSON.stringify(payload, null, 2))
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      httpStatus = response.status
      const responseText = await response.text()
      
      // Try to parse as JSON, otherwise keep as text
      try {
        responseData = JSON.parse(responseText)
      } catch {
        responseData = { 
          message: 'Non-JSON response',
          response_text: responseText.substring(0, 500), // Truncate long responses
          content_type: response.headers.get('content-type')
        }
      }

      if (!response.ok) {
        // Provide more specific error messages based on status code
        switch (response.status) {
          case 410:
            errorMessage = 'Webhook URL expired or deleted. Please update your Make.com webhook URL.'
            break
          case 404:
            errorMessage = 'Webhook URL not found. Please verify your Make.com webhook URL is correct.'
            break
          case 400:
            errorMessage = 'Bad request. The payload format may not be supported by your Make.com scenario.'
            break
          case 401:
            errorMessage = 'Unauthorized. Check if your Make.com scenario requires authentication.'
            break
          case 403:
            errorMessage = 'Forbidden. Your Make.com scenario may not accept requests from this source.'
            break
          case 500:
            errorMessage = 'Make.com server error. Please try again later or check your scenario.'
            break
          default:
            errorMessage = responseData?.message || responseData?.error || `HTTP ${response.status}: ${response.statusText}`
        }
        
        console.error(`Make.com webhook failed with status ${response.status}:`, {
          status: response.status,
          statusText: response.statusText,
          responseData,
          webhookUrl: webhookUrl.substring(0, 50) + '...' // Log partial URL for debugging
        })
      } else {
        console.log('Successfully sent to Make.com:', {
          status: response.status,
          responseData
        })
      }
    } catch (error) {
      httpStatus = 0
      errorMessage = error instanceof Error ? error.message : 'Network error'
      responseData = { error: errorMessage }
      console.error('Failed to send to Make.com:', error)
    }

    // Log the integration attempt
    const { error: logError } = await supabase
      .from('make_integration_logs')
      .insert({
        lead_id: leadId,
        event_type: eventType,
        status: errorMessage ? 'failed' : 'success',
        http_status: httpStatus,
        error_message: errorMessage,
        response_data: responseData,
        attempts: 1
      })

    if (logError) {
      console.error('Failed to log Make integration:', logError)
    }

    if (errorMessage) {
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send to Make.com',
          details: errorMessage,
          http_status: httpStatus
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        http_status: httpStatus,
        response_data: responseData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Send to Make error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})