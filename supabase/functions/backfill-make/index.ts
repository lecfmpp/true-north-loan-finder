import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface BackfillRequest {
  dateFrom?: string
  dateTo?: string
  eventTypes?: string[]
  batchSize?: number
  dryRun?: boolean
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

    const body = await req.json() as BackfillRequest
    const {
      dateFrom = '2024-01-01',
      dateTo = new Date().toISOString().split('T')[0],
      eventTypes = ['lead_created'],
      batchSize = 50,
      dryRun = false
    } = body

    console.log('Starting Make.com backfill:', { dateFrom, dateTo, eventTypes, batchSize, dryRun })

    // Check if Make.com integration is enabled
    const { data: settings, error: settingsError } = await supabase
      .from('make_integration_settings')
      .select('enabled, webhook_url, event_toggles')
      .single()

    if (settingsError || !settings?.enabled || !settings.webhook_url) {
      return new Response(
        JSON.stringify({ error: 'Make.com integration is not enabled or configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build query to get historical leads
    let query = supabase
      .from('quiz_responses')
      .select('id, created_at, name, email')
      .gte('created_at', `${dateFrom}T00:00:00Z`)
      .lte('created_at', `${dateTo}T23:59:59Z`)
      .order('created_at', { ascending: true })

    // Get total count for progress tracking
    const { count: totalLeads } = await supabase
      .from('quiz_responses')
      .select('id', { count: 'exact' })
      .gte('created_at', `${dateFrom}T00:00:00Z`)
      .lte('created_at', `${dateTo}T23:59:59Z`)

    if (!totalLeads) {
      return new Response(
        JSON.stringify({ message: 'No leads found in the specified date range' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${totalLeads} leads to potentially backfill`)

    if (dryRun) {
      return new Response(
        JSON.stringify({ 
          message: 'Dry run completed',
          totalLeads,
          eventTypes,
          dateRange: { from: dateFrom, to: dateTo }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let processedCount = 0
    let queuedCount = 0
    let skipCount = 0
    let offset = 0

    while (offset < totalLeads) {
      // Fetch batch of leads
      const { data: leads, error: leadsError } = await query
        .range(offset, offset + batchSize - 1)

      if (leadsError) {
        console.error('Error fetching leads batch:', leadsError)
        throw new Error('Failed to fetch leads batch')
      }

      if (!leads || leads.length === 0) {
        break
      }

      console.log(`Processing batch ${Math.floor(offset / batchSize) + 1}: leads ${offset + 1} to ${offset + leads.length}`)

      // Queue each lead for each event type
      for (const lead of leads) {
        for (const eventType of eventTypes) {
          // Check if already queued or processed recently
          const { data: existingQueue } = await supabase
            .from('make_integration_queue')
            .select('id')
            .eq('lead_id', lead.id)
            .eq('event_type', eventType)
            .in('status', ['pending', 'processing', 'retrying', 'completed'])
            .single()

          if (existingQueue) {
            skipCount++
            continue
          }

          // Queue the lead
          const { error: queueError } = await supabase
            .from('make_integration_queue')
            .insert({
              lead_id: lead.id,
              event_type: eventType,
              priority: 200, // Lower priority for backfill
              scheduled_at: new Date().toISOString()
            })

          if (queueError) {
            console.error(`Error queuing lead ${lead.id} for ${eventType}:`, queueError)
          } else {
            queuedCount++
            console.log(`Queued lead ${lead.id} (${lead.name}) for ${eventType}`)
          }
        }
        processedCount++
      }

      offset += leads.length

      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    console.log(`Backfill complete. Processed: ${processedCount} leads, Queued: ${queuedCount} items, Skipped: ${skipCount}`)

    return new Response(
      JSON.stringify({ 
        message: 'Backfill completed successfully',
        totalLeads,
        processedLeads: processedCount,
        queuedItems: queuedCount,
        skippedItems: skipCount,
        eventTypes,
        dateRange: { from: dateFrom, to: dateTo }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Backfill Make error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})