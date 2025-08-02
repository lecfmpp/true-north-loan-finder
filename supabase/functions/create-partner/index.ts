import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    )

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check if user is superadmin
    const { data: roles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
    
    const isSuperAdmin = roles?.some(r => r.role === 'superadmin')
    if (!isSuperAdmin) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const partnerData = await req.json()
    
    // Create user account
    const { data: newUser, error: createUserError } = await supabaseClient.auth.admin.createUser({
      email: partnerData.email,
      email_confirm: true,
      user_metadata: {
        display_name: partnerData.name,
        company_name: partnerData.company_name,
        phone: partnerData.phone
      }
    })

    if (createUserError || !newUser.user) {
      console.error('Error creating user:', createUserError)
      return new Response(JSON.stringify({ error: createUserError?.message || 'Failed to create user account' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create partner record
    const { error: partnerError } = await supabaseClient
      .from('partners')
      .insert([{
        user_id: newUser.user.id,
        name: partnerData.name,
        email: partnerData.email,
        company_name: partnerData.company_name,
        phone: partnerData.phone,
        application_type: partnerData.application_type,
        status: partnerData.status
      }])

    if (partnerError) {
      console.error('Error creating partner:', partnerError)
      return new Response(JSON.stringify({ error: 'Failed to create partner record' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Assign user role
    const roleToAssign = partnerData.application_type === 'broker' ? 'broker' : 'lender'
    const { error: roleError } = await supabaseClient
      .from('user_roles')
      .insert([{
        user_id: newUser.user.id,
        role: roleToAssign,
        assigned_by: user.id
      }])

    if (roleError) {
      console.error('Role assignment error:', roleError)
      // Don't fail the whole operation if role assignment fails
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Partner created successfully with ${roleToAssign} role` 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in create-partner function:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})