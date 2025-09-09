import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get all leads that need score recalculation
    const { data: leads, error: leadsError } = await supabase
      .from('quiz_responses')
      .select('id, loan_amount, monthly_revenue, credit_score, time_in_business, use_of_funds, country')

    if (leadsError) throw leadsError

    // Get active scoring rules
    const { data: scoreRules, error: rulesError } = await supabase
      .from('lead_score_rules')
      .select('*')
      .eq('is_active', true)
      .order('score_points', { ascending: false })

    if (rulesError) throw rulesError

    let updatedCount = 0

    // Process each lead
    for (const lead of leads || []) {
      let totalScore = 0

      // Apply each scoring rule
      for (const rule of scoreRules || []) {
        const fieldValue = lead[rule.criteria_field as keyof typeof lead]
        let ruleMatched = false

        // Convert credit score text to numeric value for comparison
        let numericFieldValue = fieldValue
        if (rule.criteria_field === 'credit_score' && typeof fieldValue === 'string') {
          switch (fieldValue.toLowerCase()) {
            case 'excellent': numericFieldValue = 775; break;
            case 'good': numericFieldValue = 725; break;
            case 'fair': numericFieldValue = 675; break;
            case 'poor': numericFieldValue = 625; break;
            case 'unsure': numericFieldValue = 650; break;
            default: numericFieldValue = 650;
          }
        }

        // Convert monthly revenue text to numeric if needed
        if (rule.criteria_field === 'monthly_revenue' && typeof fieldValue === 'string') {
          const cleanValue = fieldValue.replace(/[^0-9]/g, '')
          numericFieldValue = parseInt(cleanValue) || 0
        }

        const criteriaValue = parseFloat(rule.criteria_value) || rule.criteria_value

        switch (rule.criteria_operator) {
          case 'greater_than':
            if (parseFloat(numericFieldValue as string) > parseFloat(criteriaValue as string)) {
              ruleMatched = true
            }
            break
          case 'less_than':
            if (parseFloat(numericFieldValue as string) < parseFloat(criteriaValue as string)) {
              ruleMatched = true
            }
            break
          case 'equals':
            if (numericFieldValue === criteriaValue) {
              ruleMatched = true
            }
            break
          case 'contains':
            if (numericFieldValue && String(numericFieldValue).toLowerCase().includes(String(criteriaValue).toLowerCase())) {
              ruleMatched = true
            }
            break
          case 'not_equals':
            if (numericFieldValue !== criteriaValue) {
              ruleMatched = true
            }
            break
        }

        if (ruleMatched) {
          totalScore += rule.score_points
        }
      }

      // Cap score at 100
      const finalScore = Math.min(totalScore, 100)

      // Update the lead's score
      const { error: updateError } = await supabase
        .from('quiz_responses')
        .update({ score: finalScore })
        .eq('id', lead.id)

      if (updateError) {
        console.error(`Error updating score for lead ${lead.id}:`, updateError)
      } else {
        updatedCount++
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully recalculated scores for ${updatedCount} leads`,
        totalLeads: leads?.length || 0,
        updatedCount
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error recalculating scores:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to recalculate scores',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})