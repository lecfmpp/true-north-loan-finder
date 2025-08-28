-- Clean up ad_spend_records table by removing rows with zero spend amounts
DELETE FROM public.ad_spend_records 
WHERE amount = 0;