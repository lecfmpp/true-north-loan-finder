import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface UpdateSettingsRequest {
  enabled: boolean
  webhookUrl?: string
  eventToggles: {
    lead_created: boolean
    partner_assigned: boolean
    application_submitted: boolean
  }
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

    const { enabled, webhookUrl, eventToggles }: UpdateSettingsRequest = await req.json()

    // Update settings in database
    const { data: existingSettings } = await supabase
      .from('make_integration_settings')
      .select('id')
      .single()

    let result
    if (existingSettings) {
      // Update existing settings
      result = await supabase
        .from('make_integration_settings')
        .update({
          enabled,
          event_toggles: eventToggles,
          webhook_url: webhookUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSettings.id)
        .select()
        .single()
    } else {
      // Create new settings
      result = await supabase
        .from('make_integration_settings')
        .insert({
          enabled,
          event_toggles: eventToggles,
          webhook_url: webhookUrl,
          created_by: user.id
        })
        .select()
        .single()
    }

    if (result.error) {
      console.error('Failed to update Make settings:', result.error)
      throw new Error('Failed to update integration settings')
    }

    console.log('Make.com settings updated successfully')

    return new Response(
      JSON.stringify({ 
        success: true,
        settings: result.data
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Update Make settings error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})