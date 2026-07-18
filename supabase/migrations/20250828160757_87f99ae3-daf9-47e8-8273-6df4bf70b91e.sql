-- Add 1 day to all dates in ad_spend_records table to fix date mismatch
UPDATE public.ad_spend_records 
SET date = date + INTERVAL '1 day';