-- Harden RLS for sensitive payment data in payment_records
-- 1) Deny anonymous access to all commands on payment_records (defense in depth)
DROP POLICY IF EXISTS "No public access to payment records" ON public.payment_records;
CREATE POLICY "Deny anonymous access to payment_records"
ON public.payment_records
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- 2) Restrict inserts to management users only (service role bypasses RLS and remains unaffected)
DROP POLICY IF EXISTS "System can insert payment records" ON public.payment_records;
CREATE POLICY "Management can insert payment records"
ON public.payment_records
FOR INSERT
TO authenticated
WITH CHECK (has_management_access(auth.uid()));

-- (No changes to existing SELECT/UPDATE policies):
-- "Users can view their own payment records" (SELECT USING auth.uid() = user_id)
-- "Management can view all payment records" (SELECT USING has_management_access(auth.uid()))
-- "Management can update payment records" (UPDATE USING has_management_access(auth.uid()))
