-- Update the get_roi_metrics function to include commission generated calculation
DROP FUNCTION IF EXISTS public.get_roi_metrics(date, date);

CREATE OR REPLACE FUNCTION public.get_roi_metrics(start_date date DEFAULT (CURRENT_DATE - '30 days'::interval), end_date date DEFAULT CURRENT_DATE)
 RETURNS TABLE(
   total_leads bigint, 
   total_spend integer, 
   cost_per_lead numeric, 
   total_revenue integer, 
   roi_percentage numeric, 
   channel_breakdown jsonb,
   qualified_leads bigint,
   funded_leads bigint,
   all_leads bigint,
   application_leads bigint,
   commission_generated numeric
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  lead_count BIGINT;
  spend_amount INTEGER;
  revenue_amount INTEGER;
  qualified_count BIGINT;
  funded_count BIGINT;
  all_leads_count BIGINT;
  application_count BIGINT;
  commission_total NUMERIC;
BEGIN
  -- Get total leads in date range (existing logic)
  SELECT COUNT(*) INTO lead_count
  FROM public.quiz_responses 
  WHERE DATE(created_at) BETWEEN start_date AND end_date;
  
  -- Get total spend in date range
  SELECT COALESCE(SUM(amount), 0) INTO spend_amount
  FROM public.ad_spend_records 
  WHERE date BETWEEN start_date AND end_date;
  
  -- Get total revenue in date range
  SELECT COALESCE(SUM(lead_value), 0) INTO revenue_amount
  FROM public.quiz_responses 
  WHERE DATE(created_at) BETWEEN start_date AND end_date
  AND conversion_status = 'converted';
  
  -- Get qualified leads (monthly revenue >= 10000)
  SELECT COUNT(*) INTO qualified_count
  FROM public.quiz_responses 
  WHERE DATE(created_at) BETWEEN start_date AND end_date
  AND monthly_revenue >= 10000;
  
  -- Get funded leads (status indicates loan approved)
  SELECT COUNT(*) INTO funded_count
  FROM public.quiz_responses 
  WHERE DATE(created_at) BETWEEN start_date AND end_date
  AND (status = 'loan_approved' OR conversion_status = 'funded');
  
  -- Get all leads (no filtering by date for total count)
  SELECT COUNT(*) INTO all_leads_count
  FROM public.quiz_responses;
  
  -- Get application leads (who submitted USA or Canadian applications)
  SELECT COUNT(DISTINCT qr.id) INTO application_count
  FROM public.quiz_responses qr
  WHERE DATE(qr.created_at) BETWEEN start_date AND end_date
  AND (
    EXISTS (SELECT 1 FROM public.usa_applications ua WHERE ua.quiz_response_id = qr.id)
    OR 
    EXISTS (SELECT 1 FROM public.canadian_applications ca WHERE ca.quiz_response_id = qr.id)
  );
  
  -- Calculate commission generated from funded leads with partner loan amounts
  SELECT COALESCE(SUM((qr.partner_loan_amount / 100.0) * (p.commission_percentage / 100.0)), 0) INTO commission_total
  FROM public.quiz_responses qr
  JOIN public.partners p ON qr.assigned_partner_id = p.id
  WHERE DATE(qr.created_at) BETWEEN start_date AND end_date
  AND (qr.status = 'loan_approved' OR qr.conversion_status = 'funded')
  AND qr.partner_loan_amount IS NOT NULL
  AND p.commission_percentage IS NOT NULL;
  
  RETURN QUERY SELECT 
    lead_count,
    spend_amount,
    CASE WHEN lead_count > 0 THEN ROUND(spend_amount::NUMERIC / lead_count, 2) ELSE 0 END,
    revenue_amount,
    CASE WHEN spend_amount > 0 THEN ROUND(((revenue_amount::NUMERIC - spend_amount) / spend_amount) * 100, 2) ELSE 0 END,
    '{}'::JSONB, -- Channel breakdown to be implemented
    qualified_count,
    funded_count,
    all_leads_count,
    application_count,
    ROUND(commission_total, 2);
END;
$function$;