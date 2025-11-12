import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface AutoSendRequest {
  leadId: string
  partnerId: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { leadId, partnerId }: AutoSendRequest = await req.json()

    console.log(`Checking auto-send for lead ${leadId}, partner ${partnerId}`)

    // Check if partner has ClickUp auto-send enabled
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('clickup_enabled, auto_send_to_clickup')
      .eq('id', partnerId)
      .single()

    if (partnerError || !partner) {
      console.log('Partner not found or error:', partnerError)
      return new Response(
        JSON.stringify({ message: 'Partner not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!partner.clickup_enabled || !partner.auto_send_to_clickup) {
      console.log('Auto-send not enabled for this partner')
      return new Response(
        JSON.stringify({ message: 'Auto-send not enabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send to ClickUp
    const { data, error } = await supabase.functions.invoke('send-lead-to-clickup', {
      body: { leadId, partnerId }
    })

    if (error) {
      console.error('Failed to send to ClickUp:', error)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send to ClickUp',
          details: error.message 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Successfully sent lead to ClickUp:', data)
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Lead sent to ClickUp',
        data 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Auto-send ClickUp error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
