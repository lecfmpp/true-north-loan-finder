-- Check current RLS status for sensitive application tables
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN 'RLS Enabled'
    ELSE 'RLS DISABLED - SECURITY RISK'
  END as security_status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('usa_applications', 'usa_applications_simplified', 'canadian_applications')
ORDER BY tablename;

-- Check existing policies for these tables
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('usa_applications', 'usa_applications_simplified', 'canadian_applications')
ORDER BY tablename, policyname;