-- Check all policies on quiz_responses table with detailed info
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

-- Check for any additional constraints or triggers that might be blocking inserts
SELECT 
    constraint_name, 
    constraint_type, 
    table_name, 
    column_name 
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_name = 'quiz_responses' 
    AND tc.constraint_type IN ('CHECK', 'FOREIGN KEY');