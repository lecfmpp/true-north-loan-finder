import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LeadData {
  id: string;
  email: string;
  phone: string;
  name: string;
  loan_amount: number;
  monthly_revenue: number;
  time_in_business: string;
  credit_score: string;
  use_of_funds: string;
  [key: string]: any;
}

interface ValidationRule {
  id: string;
  rule_name: string;
  rule_type: 'field_validation' | 'duplicate_check' | 'business_logic';
  conditions: any;
  action: 'accept' | 'reject' | 'flag';
  is_active: boolean;
}

interface RoutingRule {
  id: string;
  rule_name: string;
  routing_type: 'exclusive' | 'multi_sell' | 'weighted' | 'ping_post';
  lead_criteria: any;
  target_buyers: string[];
  weights?: any;
  max_buyers?: number;
  is_active: boolean;
  priority: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { leadId } = await req.json();
    
    if (!leadId) {
      return new Response(JSON.stringify({ error: 'Lead ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log(`Processing lead: ${leadId}`);

    // Step 1: Fetch the lead data
    const { data: leadData, error: leadError } = await supabase
      .from('quiz_responses')
      .select('*')
      .eq('id', leadId)
      .single();

    if (leadError || !leadData) {
      console.error('Lead fetch error:', leadError);
      return new Response(JSON.stringify({ error: 'Lead not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 2: Check engine settings
    const { data: engineSettings } = await supabase
      .from('lead_engine_settings')
      .select('setting_key, setting_value');

    const settings: Record<string, any> = {};
    engineSettings?.forEach(setting => {
      settings[setting.setting_key] = setting.setting_value;
    });

    const validationEnabled = settings.validation_enabled === true || settings.validation_enabled === 'true';
    const routingEnabled = settings.routing_enabled === true || settings.routing_enabled === 'true';

    console.log('Engine settings:', { validationEnabled, routingEnabled });

    let processingResult = {
      leadId,
      validated: false,
      validationErrors: [] as string[],
      routed: false,
      routingResult: null as any,
      status: 'processed'
    };

    // Step 3: Lead Validation
    if (validationEnabled) {
      console.log('Starting lead validation...');
      
      const { data: validationRules } = await supabase
        .from('lead_validation_rules')
        .select('*')
        .eq('is_active', true)
        .order('priority');

      if (validationRules) {
        for (const rule of validationRules) {
          const validationResult = await validateLead(leadData, rule, supabase);
          
          if (!validationResult.passed) {
            processingResult.validationErrors.push(validationResult.error || 'Validation failed');
            
            if (rule.action === 'reject') {
              // Update lead status and stop processing
              await supabase
                .from('quiz_responses')
                .update({ 
                  status: 'rejected',
                  admin_notes: `Rejected by validation rule: ${rule.rule_name}` 
                })
                .eq('id', leadId);
              
              processingResult.status = 'rejected';
              break;
            }
          }
        }
      }
      
      processingResult.validated = true;
    }

    // Step 4: Lead Routing (only if not rejected)
    if (routingEnabled && processingResult.status !== 'rejected') {
      console.log('Starting lead routing...');
      
      const { data: routingRules } = await supabase
        .from('lead_routing_rules')
        .select('*')
        .eq('is_active', true)
        .order('priority');

      if (routingRules) {
        for (const rule of routingRules) {
          if (await matchesRoutingCriteria(leadData, rule)) {
            console.log(`Matched routing rule: ${rule.rule_name}`);
            
            const routingResult = await routeLead(leadData, rule, supabase);
            processingResult.routingResult = routingResult;
            processingResult.routed = true;
            
            // Log routing history
            await supabase
              .from('lead_routing_history')
              .insert({
                lead_id: leadId,
                rule_id: rule.id,
                routing_type: rule.routing_type,
                routing_decision: routingResult,
                buyers_assigned: routingResult.assignedBuyers || []
              });
            
            break; // Use first matching rule
          }
        }
      }
    }

    // Step 5: Update processing status
    await supabase
      .from('quiz_responses')
      .update({ 
        updated_at: new Date().toISOString(),
        admin_notes: `Processed by engine - Validated: ${processingResult.validated}, Routed: ${processingResult.routed}`
      })
      .eq('id', leadId);

    console.log('Lead processing completed:', processingResult);

    return new Response(JSON.stringify(processingResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Lead processing error:', error);
    return new Response(JSON.stringify({ 
      error: 'Processing failed', 
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function validateLead(leadData: LeadData, rule: ValidationRule, supabase: any): Promise<{ passed: boolean; error?: string }> {
  try {
    switch (rule.rule_type) {
      case 'duplicate_check':
        return await checkDuplicates(leadData, rule, supabase);
      
      case 'field_validation':
        return validateFields(leadData, rule);
      
      case 'business_logic':
        return validateBusinessLogic(leadData, rule);
      
      default:
        return { passed: true };
    }
  } catch (error) {
    console.error('Validation error:', error);
    return { passed: false, error: 'Validation failed' };
  }
}

async function checkDuplicates(leadData: LeadData, rule: ValidationRule, supabase: any): Promise<{ passed: boolean; error?: string }> {
  const conditions = rule.conditions;
  
  if (conditions.check_email && leadData.email) {
    const { data: emailDupes } = await supabase
      .from('quiz_responses')
      .select('id')
      .eq('email', leadData.email)
      .neq('id', leadData.id)
      .gte('created_at', new Date(Date.now() - (conditions.timeframe_hours || 24) * 60 * 60 * 1000).toISOString());
    
    if (emailDupes && emailDupes.length > 0) {
      return { passed: false, error: 'Duplicate email found' };
    }
  }
  
  if (conditions.check_phone && leadData.phone) {
    const { data: phoneDupes } = await supabase
      .from('quiz_responses')
      .select('id')
      .eq('phone', leadData.phone)
      .neq('id', leadData.id)
      .gte('created_at', new Date(Date.now() - (conditions.timeframe_hours || 24) * 60 * 60 * 1000).toISOString());
    
    if (phoneDupes && phoneDupes.length > 0) {
      return { passed: false, error: 'Duplicate phone found' };
    }
  }
  
  return { passed: true };
}

function validateFields(leadData: LeadData, rule: ValidationRule): { passed: boolean; error?: string } {
  const conditions = rule.conditions;
  
  for (const [field, validation] of Object.entries(conditions)) {
    const value = leadData[field];
    
    if (validation.required && (!value || value === '')) {
      return { passed: false, error: `Required field ${field} is missing` };
    }
    
    if (validation.min_value && parseFloat(value) < validation.min_value) {
      return { passed: false, error: `${field} below minimum value` };
    }
    
    if (validation.max_value && parseFloat(value) > validation.max_value) {
      return { passed: false, error: `${field} above maximum value` };
    }
    
    if (validation.allowed_values && !validation.allowed_values.includes(value)) {
      return { passed: false, error: `${field} has invalid value` };
    }
  }
  
  return { passed: true };
}

function validateBusinessLogic(leadData: LeadData, rule: ValidationRule): { passed: boolean; error?: string } {
  const conditions = rule.conditions;
  
  // Example business logic validations
  if (conditions.min_loan_amount && leadData.loan_amount < conditions.min_loan_amount) {
    return { passed: false, error: 'Loan amount too small' };
  }
  
  if (conditions.min_monthly_revenue && leadData.monthly_revenue < conditions.min_monthly_revenue) {
    return { passed: false, error: 'Monthly revenue too low' };
  }
  
  if (conditions.excluded_states && conditions.excluded_states.includes(leadData.state)) {
    return { passed: false, error: 'State not accepted' };
  }
  
  return { passed: true };
}

async function matchesRoutingCriteria(leadData: LeadData, rule: RoutingRule): Promise<boolean> {
  const criteria = rule.lead_criteria;
  
  // Check loan amount range
  if (criteria.min_loan_amount && leadData.loan_amount < criteria.min_loan_amount) {
    return false;
  }
  
  if (criteria.max_loan_amount && leadData.loan_amount > criteria.max_loan_amount) {
    return false;
  }
  
  // Check monthly revenue
  if (criteria.min_monthly_revenue && leadData.monthly_revenue < criteria.min_monthly_revenue) {
    return false;
  }
  
  // Check time in business
  if (criteria.time_in_business && criteria.time_in_business.length > 0) {
    if (!criteria.time_in_business.includes(leadData.time_in_business)) {
      return false;
    }
  }
  
  // Check credit score
  if (criteria.credit_scores && criteria.credit_scores.length > 0) {
    if (!criteria.credit_scores.includes(leadData.credit_score)) {
      return false;
    }
  }
  
  // Check industries/use of funds
  if (criteria.industries && criteria.industries.length > 0) {
    const matchesIndustry = criteria.industries.some((industry: string) => 
      leadData.use_of_funds?.toLowerCase().includes(industry.toLowerCase())
    );
    if (!matchesIndustry) {
      return false;
    }
  }
  
  return true;
}

async function routeLead(leadData: LeadData, rule: RoutingRule, supabase: any): Promise<any> {
  const { data: buyers } = await supabase
    .from('lead_buyers')
    .select('*')
    .in('id', rule.target_buyers)
    .eq('is_active', true)
    .order('priority_score', { ascending: false });

  if (!buyers || buyers.length === 0) {
    return { success: false, error: 'No active buyers available' };
  }

  let assignedBuyers: string[] = [];
  
  switch (rule.routing_type) {
    case 'exclusive':
      // Assign to highest priority buyer
      assignedBuyers = [buyers[0].id];
      break;
      
    case 'multi_sell':
      // Assign to specified number of buyers
      const maxBuyers = Math.min(rule.max_buyers || 3, buyers.length);
      assignedBuyers = buyers.slice(0, maxBuyers).map(b => b.id);
      break;
      
    case 'weighted':
      // Implement weighted distribution (simplified)
      assignedBuyers = [selectWeightedBuyer(buyers, rule.weights)];
      break;
      
    case 'ping_post':
      // Add to ping queue for bidding
      await supabase
        .from('lead_queue')
        .insert({
          lead_id: leadData.id,
          queue_type: 'ping_post',
          status: 'pending',
          metadata: {
            rule_id: rule.id,
            potential_buyers: buyers.map(b => b.id)
          }
        });
      
      return { 
        success: true, 
        routingType: 'ping_post', 
        message: 'Added to ping-post queue',
        assignedBuyers: []
      };
  }

  // Create lead assignments
  for (const buyerId of assignedBuyers) {
    await supabase
      .from('lead_assignments')
      .insert({
        quiz_response_id: leadData.id,
        partner_id: buyerId,
        assigned_by: 'system',
        status: 'assigned'
      });
  }

  // Update the lead with primary assignment (for compatibility)
  if (assignedBuyers.length > 0) {
    await supabase
      .from('quiz_responses')
      .update({ assigned_partner_id: assignedBuyers[0] })
      .eq('id', leadData.id);
  }

  return {
    success: true,
    routingType: rule.routing_type,
    assignedBuyers,
    totalAssigned: assignedBuyers.length
  };
}

function selectWeightedBuyer(buyers: any[], weights: any): string {
  // Simple weighted selection implementation
  const totalWeight = buyers.reduce((sum, buyer) => sum + (weights[buyer.id] || 1), 0);
  let random = Math.random() * totalWeight;
  
  for (const buyer of buyers) {
    const weight = weights[buyer.id] || 1;
    random -= weight;
    if (random <= 0) {
      return buyer.id;
    }
  }
  
  return buyers[0].id; // Fallback
}