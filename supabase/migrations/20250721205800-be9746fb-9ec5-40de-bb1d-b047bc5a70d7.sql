-- Check all policies on quiz_responses table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'quiz_responses'
ORDER BY policyname;

-- Also check if RLS is properly enabled
SELECT schemaname, tablename, rowsecurity, forcerowsecurity 
FROM pg_tables 
WHERE tablename = 'quiz_responses';