-- Check all policies on quiz_responses table
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
WHERE tablename = 'quiz_responses'
ORDER BY policyname;

-- Check if RLS is enabled
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename = 'quiz_responses';

-- Check for any table constraints
SELECT 
    tc.constraint_name, 
    tc.constraint_type, 
    tc.table_name, 
    ccu.column_name 
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_name = 'quiz_responses' 
    AND tc.constraint_type IN ('CHECK', 'FOREIGN KEY');