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
    console.log('Create partner function called')
    
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
    
    let targetUserId = null
    let isNewUser = false

    // First, check if user already exists
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
      console.log('User already exists, using existing user ID:', existingUser.id)
      targetUserId = existingUser.id
      isNewUser = false
    } else {
      console.log('Creating new user account...')
      // Create new user account
      const { data: newUser, error: createUserError } = await supabaseClient.auth.admin.createUser({
        email: partnerData.email,
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

      targetUserId = newUser.user.id
      isNewUser = true
    }

    // Create partner record
    const { error: partnerError } = await supabaseClient
      .from('partners')
      .insert([{
        user_id: targetUserId,
        name: partnerData.name,
        email: partnerData.email,
        company_name: partnerData.company_name,
        phone: partnerData.phone,
        application_type: partnerData.application_type,
        status: partnerData.status
      }])

    console.log('Partner creation result:', { error: partnerError?.message })

    if (partnerError) {
      console.error('Error creating partner:', partnerError)
      return new Response(JSON.stringify({ error: 'Failed to create partner record' }), {
        status: 400,
        headers: corsHeaders,
      })
    }

    // Assign user role (only if they don't already have it)
    const roleToAssign = partnerData.application_type === 'broker' ? 'broker' : 'lender'
    
    // Check if user already has this role
    const { data: existingRoles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', targetUserId)
      .eq('role', roleToAssign)
    
    if (!existingRoles || existingRoles.length === 0) {
      const { error: roleError } = await supabaseClient
        .from('user_roles')
        .insert([{
          user_id: targetUserId,
          role: roleToAssign,
          assigned_by: user.id
        }])

      console.log('Role assignment result:', { role: roleToAssign, error: roleError?.message })

      if (roleError) {
        console.error('Role assignment error:', roleError)
        // Don't fail the whole operation if role assignment fails
      }
    } else {
      console.log('User already has role:', roleToAssign)
    }

    console.log('Partner created successfully')

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Partner created successfully with ${roleToAssign} role` 
    }), {
      headers: corsHeaders,
    })

  } catch (error) {
    console.error('Error in create-partner function:', error)
    return new Response(JSON.stringify({ error: 'Internal server error: ' + error.message }), {
      status: 500,
      headers: corsHeaders,
    })
  }
})