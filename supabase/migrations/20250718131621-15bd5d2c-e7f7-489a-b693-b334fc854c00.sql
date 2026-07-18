-- Update all social proof notifications to use TrueNorth Business Loan as the lender
UPDATE social_proof_notifications 
SET lender = 'TrueNorth Business Loan', 
    updated_at = now()
WHERE lender != 'TrueNorth Business Loan';