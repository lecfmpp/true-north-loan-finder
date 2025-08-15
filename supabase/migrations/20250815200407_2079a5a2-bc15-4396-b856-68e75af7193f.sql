-- Remove the vulnerable "Management limited partner access" policy
-- This policy allows competitors with management roles to harvest all partner contact information

DROP POLICY IF EXISTS "Management limited partner access" ON partners;

-- Add comment explaining the security fix
COMMENT ON TABLE partners IS 'Partner data is now restricted to: 1) Superadmins (full access), 2) Partners (own data only). Management users no longer have access to other partners'' contact information to prevent competitive data harvesting.';