import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface AutoSendRequest {
  leadId: string
  partnerId: string
  assignedBy: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { leadId, partnerId, assignedBy }: AutoSendRequest = await req.json()

    if (!leadId || !partnerId) {
      throw new Error('Missing required fields: leadId, partnerId')
    }

    // Check if Make.com integration is enabled and auto-send is configured
    const { data: settings, error: settingsError } = await supabase
      .from('make_integration_settings')
      .select('enabled, event_toggles')
      .single()

    if (settingsError) {
      console.log('Make.com settings not found, skipping auto-send')
      return new Response(
        JSON.stringify({ message: 'Make.com integration not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!settings.enabled) {
      console.log('Make.com integration disabled, skipping auto-send')
      return new Response(
        JSON.stringify({ message: 'Make.com integration disabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const eventToggles = settings.event_toggles || {}
    if (!eventToggles.auto_send_on_assignment) {
      console.log('Auto-send on assignment disabled, skipping')
      return new Response(
        JSON.stringify({ message: 'Auto-send on assignment disabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send to Make.com using the send-to-make function
    const { data, error } = await supabase.functions.invoke('send-to-make', {
      body: {
        leadId,
        eventType: 'partner_assigned'
      }
    })

    if (error) {
      console.error('Failed to send to Make.com:', error)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send to Make.com',
          details: error.message 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Successfully triggered Make.com send on partner assignment')
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Successfully sent to Make.com',
        data 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Auto-send Make error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})