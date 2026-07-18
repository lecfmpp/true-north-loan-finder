import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface QueueItem {
  id: string
  lead_id: string
  event_type: string
  attempts: number
  max_attempts: number
  priority: number
  payload?: any
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    console.log('Processing Make.com queue...')

    // Get current settings
    const { data: settings, error: settingsError } = await supabase
      .from('make_integration_settings')
      .select('enabled, webhook_url, event_toggles, field_mappings')
      .single()

    if (settingsError || !settings?.enabled || !settings.webhook_url) {
      console.log('Make.com integration disabled or not configured')
      return new Response(
        JSON.stringify({ message: 'Integration disabled or not configured', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get pending queue items (up to 10 at a time, ordered by priority and schedule)
    const { data: queueItems, error: queueError } = await supabase
      .from('make_integration_queue')
      .select('*')
      .in('status', ['pending', 'retrying'])
      .lte('scheduled_at', new Date().toISOString())
      .order('priority', { ascending: true })
      .order('scheduled_at', { ascending: true })
      .limit(10)

    if (queueError) {
      console.error('Failed to fetch queue items:', queueError)
      throw new Error('Failed to fetch queue items')
    }

    if (!queueItems || queueItems.length === 0) {
      console.log('No pending items in queue')
      return new Response(
        JSON.stringify({ message: 'No pending items', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processing ${queueItems.length} queue items`)
    let processedCount = 0
    let failedCount = 0

    // Process each queue item
    for (const item of queueItems as QueueItem[]) {
      try {
        console.log(`Processing queue item ${item.id} for lead ${item.lead_id}, event: ${item.event_type}`)

        // Mark as processing
        await supabase
          .from('make_integration_queue')
          .update({ 
            status: 'processing',
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id)

        // Check if event type is still enabled
        const eventToggles = settings.event_toggles || {}
        if (!eventToggles[item.event_type]) {
          console.log(`Event type ${item.event_type} is disabled, marking as completed`)
          await supabase
            .from('make_integration_queue')
            .update({
              status: 'completed',
              processed_at: new Date().toISOString(),
              error_message: 'Event type disabled'
            })
            .eq('id', item.id)
          processedCount++
          continue
        }

        // Send to Make.com using the existing send-to-make function
        const sendResponse = await supabase.functions.invoke('send-to-make', {
          body: {
            leadId: item.lead_id,
            eventType: item.event_type,
            overridePayload: item.payload
          }
        })

        let newStatus = 'completed'
        let errorMessage = null
        let responseData = null

        if (sendResponse.error) {
          console.error(`Failed to send queue item ${item.id}:`, sendResponse.error)
          errorMessage = sendResponse.error.message || 'Unknown error'
          
          // Determine if we should retry
          const newAttempts = item.attempts + 1
          if (newAttempts < item.max_attempts) {
            newStatus = 'retrying'
            // Exponential backoff: 2^attempts minutes
            const retryDelayMinutes = Math.pow(2, newAttempts)
            const scheduledAt = new Date()
            scheduledAt.setMinutes(scheduledAt.getMinutes() + retryDelayMinutes)
            
            await supabase
              .from('make_integration_queue')
              .update({
                status: newStatus,
                attempts: newAttempts,
                scheduled_at: scheduledAt.toISOString(),
                error_message: errorMessage,
                updated_at: new Date().toISOString()
              })
              .eq('id', item.id)
              
            console.log(`Queue item ${item.id} scheduled for retry in ${retryDelayMinutes} minutes`)
          } else {
            newStatus = 'failed'
            await supabase
              .from('make_integration_queue')
              .update({
                status: newStatus,
                attempts: newAttempts,
                processed_at: new Date().toISOString(),
                error_message: errorMessage,
                updated_at: new Date().toISOString()
              })
              .eq('id', item.id)
              
            console.log(`Queue item ${item.id} failed after ${newAttempts} attempts`)
            failedCount++
          }
        } else {
          // Success
          responseData = sendResponse.data
          await supabase
            .from('make_integration_queue')
            .update({
              status: 'completed',
              attempts: item.attempts + 1,
              processed_at: new Date().toISOString(),
              response_data: responseData,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.id)
            
          console.log(`Queue item ${item.id} processed successfully`)
          processedCount++
        }

      } catch (error) {
        console.error(`Error processing queue item ${item.id}:`, error)
        
        const newAttempts = item.attempts + 1
        if (newAttempts < item.max_attempts) {
          // Retry with exponential backoff
          const retryDelayMinutes = Math.pow(2, newAttempts)
          const scheduledAt = new Date()
          scheduledAt.setMinutes(scheduledAt.getMinutes() + retryDelayMinutes)
          
          await supabase
            .from('make_integration_queue')
            .update({
              status: 'retrying',
              attempts: newAttempts,
              scheduled_at: scheduledAt.toISOString(),
              error_message: error instanceof Error ? error.message : 'Unknown error',
              updated_at: new Date().toISOString()
            })
            .eq('id', item.id)
        } else {
          await supabase
            .from('make_integration_queue')
            .update({
              status: 'failed',
              attempts: newAttempts,
              processed_at: new Date().toISOString(),
              error_message: error instanceof Error ? error.message : 'Unknown error',
              updated_at: new Date().toISOString()
            })
            .eq('id', item.id)
          failedCount++
        }
      }
    }

    console.log(`Queue processing complete. Processed: ${processedCount}, Failed: ${failedCount}`)

    return new Response(
      JSON.stringify({ 
        message: 'Queue processing complete',
        processed: processedCount,
        failed: failedCount,
        total_items: queueItems.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Process Make queue error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})