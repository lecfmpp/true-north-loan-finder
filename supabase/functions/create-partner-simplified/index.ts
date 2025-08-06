import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 200
    });
  }

  try {
    console.log('Create simplified partner function called')
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.log('No authorization header')
      return new Response(JSON.stringify({ error: 'Unauthorized - no auth header' }), {
        status: 401,
        headers: corsHeaders,
      })
    }

    const token = authHeader.replace('Bearer ', '')
    console.log('Token extracted, length:', token.length)

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    console.log('User check result:', { user: user?.id, error: userError?.message })

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized - invalid token' }), {
        status: 401,
        headers: corsHeaders,
      })
    }

    // Check if user is superadmin
    const { data: roles, error: rolesError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
    
    console.log('Roles check:', { roles, error: rolesError?.message })
    
    const isSuperAdmin = roles?.some(r => r.role === 'superadmin')
    if (!isSuperAdmin) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions - not superadmin' }), {
        status: 403,
        headers: corsHeaders,
      })
    }

    console.log('User is superadmin, proceeding with partner creation')

    const partnerData = await req.json()
    console.log('Partner data received:', partnerData)
    
    // Validate required fields
    if (!partnerData.name || !partnerData.email || !partnerData.company_name || !partnerData.password || !partnerData.application_type) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: corsHeaders,
      })
    }

    // Check if email already exists in auth.users
    const { data: existingUsers, error: listError } = await supabaseClient.auth.admin.listUsers()
    console.log('Checking for existing users...')

    if (listError) {
      console.error('Error listing users:', listError)
      return new Response(JSON.stringify({ error: 'Failed to check existing users' }), {
        status: 500,
        headers: corsHeaders,
      })
    }

    const existingUser = existingUsers.users.find(u => u.email === partnerData.email)
    
    if (existingUser) {
      console.log('User with this email already exists')
      return new Response(JSON.stringify({ error: 'An account with this email already exists' }), {
        status: 400,
        headers: corsHeaders,
      })
    }

    console.log('Creating new user account...')
    // Create new user account
    const { data: newUser, error: createUserError } = await supabaseClient.auth.admin.createUser({
      email: partnerData.email,
      password: partnerData.password,
      email_confirm: true,
      user_metadata: {
        display_name: partnerData.name,
        company_name: partnerData.company_name,
        phone: partnerData.phone
      }
    })

    console.log('User creation result:', { user: newUser?.user?.id, error: createUserError?.message })

    if (createUserError || !newUser.user) {
      console.error('Error creating user:', createUserError)
      return new Response(JSON.stringify({ error: createUserError?.message || 'Failed to create user account' }), {
        status: 400,
        headers: corsHeaders,
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
        is_active: true
      }])

    console.log('Partner creation result:', { error: partnerError?.message })

    if (partnerError) {
      console.error('Error creating partner:', partnerError)
      return new Response(JSON.stringify({ error: 'Failed to create partner record' }), {
        status: 400,
        headers: corsHeaders,
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

    console.log('Role assignment result:', { role: roleToAssign, error: roleError?.message })

    if (roleError) {
      console.error('Role assignment error:', roleError)
      // Don't fail the whole operation if role assignment fails
    }

    console.log('Partner created successfully')

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Partner created successfully with ${roleToAssign} role` 
    }), {
      headers: corsHeaders,
    })

  } catch (error) {
    console.error('Error in create-partner-simplified function:', error)
    return new Response(JSON.stringify({ error: 'Internal server error: ' + error.message }), {
      status: 500,
      headers: corsHeaders,
    })
  }
})