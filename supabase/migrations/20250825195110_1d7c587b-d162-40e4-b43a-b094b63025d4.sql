-- Enable realtime for billing management tables

-- Enable realtime for partners table
ALTER TABLE public.partners REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.partners;

-- Enable realtime for lender_broker_applications table  
ALTER TABLE public.lender_broker_applications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lender_broker_applications;

-- Enable realtime for partner_lead_credits table
ALTER TABLE public.partner_lead_credits REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.partner_lead_credits;

-- Enable realtime for payment_records table
ALTER TABLE public.payment_records REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_records;

-- Enable realtime for lead_assignments table (for assignment tracking)
ALTER TABLE public.lead_assignments REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_assignments;