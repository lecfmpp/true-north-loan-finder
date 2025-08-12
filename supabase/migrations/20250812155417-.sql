-- Fix critical security vulnerability: Remove overly permissive RLS policy on profiles table
-- The "Profiles are viewable by everyone" policy currently allows 
-- ANY user to read ALL profiles including display names and user IDs

-- Drop the problematic policy that allows public read access to all profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create secure RLS policies for profiles table
-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Management users can view all profiles (for admin purposes)
CREATE POLICY "Management can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (has_management_access(auth.uid()));

-- This ensures user profile data is only accessible to:
-- - The profile owner themselves
-- - Management users (admins, lenders, brokers) who need it for business operations
-- - No public/anonymous access to user display names or IDs