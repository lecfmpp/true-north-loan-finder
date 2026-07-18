import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface AutoProcessRequest {
  leadId: string
  eventType: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    console.log('Auto-processing Make.com queue...')

    const { leadId, eventType }: AutoProcessRequest = await req.json()

    if (!leadId || !eventType) {
      throw new Error('Missing required fields: leadId, eventType')
    }

    // Check if Make.com integration is enabled and auto-processing is on
    const { data: settings, error: settingsError } = await supabase
      .from('make_integration_settings')
      .select('enabled, auto_process_queue, webhook_url, event_toggles')
      .single()

    if (settingsError || !settings?.enabled || !settings.auto_process_queue || !settings.webhook_url) {
      console.log('Make.com auto-processing disabled or not configured')
      return new Response(
        JSON.stringify({ message: 'Auto-processing disabled or not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if event type is enabled
    const eventToggles = settings.event_toggles || {}
    if (!eventToggles[eventType]) {
      console.log(`Event type ${eventType} is disabled`)
      return new Response(
        JSON.stringify({ message: `Event type ${eventType} is disabled` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Directly send to Make.com instead of queuing
    console.log(`Auto-processing lead ${leadId} for event ${eventType}`)
    
    const { data, error } = await supabase.functions.invoke('send-to-make', {
      body: {
        leadId,
        eventType,
        autoProcessed: true
      }
    })

    if (error) {
      console.error(`Auto-processing failed for lead ${leadId}:`, error)
      return new Response(
        JSON.stringify({ 
          error: 'Auto-processing failed',
          details: error.message || error
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Auto-processing successful for lead ${leadId}`)
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Lead auto-processed to Make.com successfully',
        leadId,
        eventType,
        data
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Auto-process Make queue error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})