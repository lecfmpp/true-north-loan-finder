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

    const { leadData } = await req.json()

    // Fetch active scoring rules
    const { data: scoreRules, error: rulesError } = await supabase
      .from('lead_score_rules')
      .select('*')
      .eq('is_active', true)
      .order('score_points', { ascending: false })

    if (rulesError) throw rulesError

    let totalScore = 0

    // Apply each scoring rule
    for (const rule of scoreRules || []) {
      const fieldValue = leadData[rule.criteria_field]
      let ruleMatched = false

      // Convert values for comparison
      const criteriaValue = parseFloat(rule.criteria_value) || rule.criteria_value

      switch (rule.criteria_operator) {
        case 'greater_than':
          if (parseFloat(fieldValue) > parseFloat(criteriaValue)) {
            ruleMatched = true
          }
          break
        case 'less_than':
          if (parseFloat(fieldValue) < parseFloat(criteriaValue)) {
            ruleMatched = true
          }
          break
        case 'equals':
          if (fieldValue === criteriaValue) {
            ruleMatched = true
          }
          break
        case 'contains':
          if (fieldValue && fieldValue.toLowerCase().includes(criteriaValue.toLowerCase())) {
            ruleMatched = true
          }
          break
        case 'not_equals':
          if (fieldValue !== criteriaValue) {
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

    return new Response(
      JSON.stringify({ 
        score: finalScore, 
        appliedRules: scoreRules?.filter(rule => {
          const fieldValue = leadData[rule.criteria_field]
          const criteriaValue = parseFloat(rule.criteria_value) || rule.criteria_value
          
          switch (rule.criteria_operator) {
            case 'greater_than':
              return parseFloat(fieldValue) > parseFloat(criteriaValue)
            case 'less_than':
              return parseFloat(fieldValue) < parseFloat(criteriaValue)
            case 'equals':
              return fieldValue === criteriaValue
            case 'contains':
              return fieldValue && fieldValue.toLowerCase().includes(criteriaValue.toLowerCase())
            case 'not_equals':
              return fieldValue !== criteriaValue
            default:
              return false
          }
        })
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error calculating lead score:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to calculate lead score' }),
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