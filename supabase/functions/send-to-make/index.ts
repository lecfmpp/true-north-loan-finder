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
      .select('enabled, event_toggles')
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

    // Fetch USA application data
    const { data: usaApplication } = await supabase
      .from('usa_applications')
      .select('application_reference_number')
      .eq('quiz_response_id', leadId)
      .single()

    // Fetch Canadian application data
    const { data: canadianApplication } = await supabase
      .from('canadian_applications')
      .select('application_reference_number')
      .eq('quiz_response_id', leadId)
      .single()

    // Build Make.com payload
    const payload = overridePayload || {
      event_type: eventType,
      idempotency_key: `${leadId}:${eventType}:${new Date().getTime()}`,
      lead: {
        id: lead.id,
        created_at: lead.created_at,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company_name: lead.company_name,
        monthly_revenue: lead.monthly_revenue,
        loan_amount: lead.loan_amount,
        credit_score: lead.credit_score,
        time_in_business: lead.time_in_business,
        use_of_funds: lead.use_of_funds,
        country: lead.country,
        city_province: lead.city_province,
        website: lead.website,
        attribution_channel: lead.attribution_channel,
        attribution_url: lead.attribution_url,
        bank_account_type: lead.bank_account_type,
        homeowner_status: lead.homeowner_status,
        score: lead.score,
        status: lead.status,
        conversion_status: lead.conversion_status
      },
      partner: lead.lead_assignments?.[0]?.partners ? {
        id: lead.lead_assignments[0].partners.id,
        name: lead.lead_assignments[0].partners.name,
        email: lead.lead_assignments[0].partners.email,
        company_name: lead.lead_assignments[0].partners.company_name
      } : null,
      applications: {
        usa: {
          exists: !!usaApplication,
          reference: usaApplication?.application_reference_number || null
        },
        canadian: {
          exists: !!canadianApplication,
          reference: canadianApplication?.application_reference_number || null
        }
      },
      metadata: {
        triggered_by_user_id: user.id,
        triggered_by_email: user.email,
        triggered_at: new Date().toISOString()
      }
    }

    // Get webhook URL from secrets
    const webhookUrl = Deno.env.get('MAKE_WEBHOOK_URL')
    if (!webhookUrl) {
      throw new Error('Make.com webhook URL not configured')
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
      responseData = await response.json().catch(() => ({ message: 'Non-JSON response' }))

      if (!response.ok) {
        errorMessage = responseData?.message || `HTTP ${response.status}`
        console.error('Make.com webhook failed:', errorMessage)
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