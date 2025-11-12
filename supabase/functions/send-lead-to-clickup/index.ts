import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface SendToClickUpRequest {
  leadId: string
  partnerId: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { leadId, partnerId }: SendToClickUpRequest = await req.json()

    console.log(`Processing ClickUp send for lead ${leadId}, partner ${partnerId}`)

    // Get partner's ClickUp settings
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('clickup_api_key, clickup_list_id, clickup_enabled, name, email')
      .eq('id', partnerId)
      .single()

    if (partnerError || !partner) {
      console.error('Partner not found:', partnerError)
      return new Response(
        JSON.stringify({ error: 'Partner not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!partner.clickup_enabled || !partner.clickup_api_key || !partner.clickup_list_id) {
      console.log('ClickUp not configured for partner')
      return new Response(
        JSON.stringify({ error: 'ClickUp integration not configured for this partner' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get lead data
    const { data: lead, error: leadError } = await supabase
      .from('quiz_responses')
      .select('*')
      .eq('id', leadId)
      .single()

    if (leadError || !lead) {
      console.error('Lead not found:', leadError)
      return new Response(
        JSON.stringify({ error: 'Lead not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prepare ClickUp task data
    const taskData = {
      name: `New Lead: ${lead.name || 'Unknown'} - ${lead.company_name || 'No Company'}`,
      description: `
**Lead Information**
- Name: ${lead.name || 'N/A'}
- Email: ${lead.email || 'N/A'}
- Phone: ${lead.phone || 'N/A'}
- Company: ${lead.company_name || 'N/A'}
- Website: ${lead.website || 'N/A'}

**Business Details**
- Loan Amount: $${lead.loan_amount?.toLocaleString() || 'N/A'}
- Monthly Revenue: $${lead.monthly_revenue?.toLocaleString() || 'N/A'}
- Time in Business: ${lead.time_in_business || 'N/A'}
- Credit Score: ${lead.credit_score || 'N/A'}
- Use of Funds: ${lead.use_of_funds || 'N/A'}

**Location**
- Country: ${lead.country || 'N/A'}
- City/Province: ${lead.city_province || 'N/A'}

**Additional Info**
- Lead Score: ${lead.score || 0}
- Status: ${lead.status || 'New'}
- Created: ${new Date(lead.created_at).toLocaleString()}
      `.trim(),
      tags: ['lead', lead.status || 'new'],
      priority: lead.score && lead.score >= 70 ? 2 : 3, // 2 = high, 3 = normal
      custom_fields: []
    }

    // Add custom fields if available
    if (lead.loan_amount) {
      taskData.custom_fields.push({
        id: 'loan_amount',
        value: lead.loan_amount
      })
    }

    // Send to ClickUp API
    const clickupResponse = await fetch(
      `https://api.clickup.com/api/v2/list/${partner.clickup_list_id}/task`,
      {
        method: 'POST',
        headers: {
          'Authorization': partner.clickup_api_key,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(taskData)
      }
    )

    const clickupResult = await clickupResponse.json()

    if (!clickupResponse.ok) {
      console.error('ClickUp API error:', clickupResult)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create ClickUp task',
          details: clickupResult
        }),
        { status: clickupResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Successfully created ClickUp task:', clickupResult.id)

    // Update lead with ClickUp task info
    await supabase
      .from('quiz_responses')
      .update({
        shared_notes: `ClickUp Task Created: ${clickupResult.url || clickupResult.id}\n${lead.shared_notes || ''}`
      })
      .eq('id', leadId)

    return new Response(
      JSON.stringify({ 
        success: true,
        task_id: clickupResult.id,
        task_url: clickupResult.url,
        message: 'Lead sent to ClickUp successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error sending lead to ClickUp:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
