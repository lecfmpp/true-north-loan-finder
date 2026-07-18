-- Add DELETE policy for payment_records to allow superadmin to delete records
CREATE POLICY "Superadmin can delete payment records" 
ON payment_records 
FOR DELETE 
USING (is_superadmin(auth.uid()));