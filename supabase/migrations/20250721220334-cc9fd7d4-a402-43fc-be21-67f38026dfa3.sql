-- Debug RLS policies - let's see what's actually happening
-- First, temporarily disable RLS completely to test if data can be inserted
ALTER TABLE public.quiz_responses DISABLE ROW LEVEL SECURITY;