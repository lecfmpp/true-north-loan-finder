-- Step 1: Drop all policies that reference the role column
DROP POLICY IF EXISTS "Admins can view all quiz responses" ON public.quiz_responses;
DROP POLICY IF EXISTS "Admins can update quiz responses" ON public.quiz_responses;
DROP POLICY IF EXISTS "Admins can delete quiz responses" ON public.quiz_responses;
DROP POLICY IF EXISTS "Admins can manage time slots" ON public.available_time_slots;
DROP POLICY IF EXISTS "Admins can view all blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins can create blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins can update blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins can delete blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins can manage email sequences" ON public.email_sequences;
DROP POLICY IF EXISTS "Admins can manage email templates" ON public.email_templates;
DROP POLICY IF EXISTS "Admins can manage email enrollments" ON public.email_enrollments;
DROP POLICY IF EXISTS "Admins can manage email sends" ON public.email_sends;
DROP POLICY IF EXISTS "Admins can manage chat widget config" ON public.chat_widget_config;
DROP POLICY IF EXISTS "Admins can manage chat widget Q&A" ON public.chat_widget_qa;
DROP POLICY IF EXISTS "Admins can view all content briefs" ON public.content_briefs;
DROP POLICY IF EXISTS "Admins can create content briefs" ON public.content_briefs;
DROP POLICY IF EXISTS "Admins can update content briefs" ON public.content_briefs;
DROP POLICY IF EXISTS "Admins can delete content briefs" ON public.content_briefs;
DROP POLICY IF EXISTS "Admins can view all contact submissions" ON public.chat_contact_submissions;
DROP POLICY IF EXISTS "Admins can update contact submissions" ON public.chat_contact_submissions;
DROP POLICY IF EXISTS "Admins can delete contact submissions" ON public.chat_contact_submissions;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.call_bookings;
DROP POLICY IF EXISTS "Admins can manage bookings" ON public.call_bookings;

-- Step 2: Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('superadmin', 'lender', 'broker', 'user');

-- Step 3: Drop the default constraint to avoid casting issues
ALTER TABLE public.profiles ALTER COLUMN role DROP DEFAULT;

-- Step 4: Update profiles table to use the new enum
ALTER TABLE public.profiles ALTER COLUMN role TYPE user_role USING role::user_role;

-- Step 5: Set the new default using the enum type
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'user'::user_role;

-- Step 6: Update existing admin user to superadmin
UPDATE public.profiles 
SET role = 'superadmin' 
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'lecfmpp@gmail.com'
);

-- Step 7: Create functions to check user permissions
CREATE OR REPLACE FUNCTION public.has_management_access(user_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = user_id_param
      AND role IN ('superadmin', 'lender', 'broker')
  )
$$;

CREATE OR REPLACE FUNCTION public.is_superadmin(user_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = user_id_param
      AND role = 'superadmin'
  )
$$;

-- Step 8: Create new RLS policies
-- Lenders and brokers can view and update leads (but not delete)
CREATE POLICY "Management users can view all quiz responses"
ON public.quiz_responses
FOR SELECT
USING (public.has_management_access(auth.uid()));

CREATE POLICY "Management users can update quiz responses"
ON public.quiz_responses
FOR UPDATE
USING (public.has_management_access(auth.uid()));

-- Only superadmin can delete leads
CREATE POLICY "Superadmin can delete quiz responses"
ON public.quiz_responses
FOR DELETE
USING (public.is_superadmin(auth.uid()));

-- Management users can manage time slots
CREATE POLICY "Management users can manage time slots"
ON public.available_time_slots
FOR ALL
USING (public.has_management_access(auth.uid()));

-- Only superadmin for blog posts
CREATE POLICY "Superadmin can manage blog posts"
ON public.blog_posts
FOR ALL
USING (public.is_superadmin(auth.uid()));

-- Only superadmin for email sequences and templates
CREATE POLICY "Superadmin can manage email sequences"
ON public.email_sequences
FOR ALL
USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Superadmin can manage email templates"
ON public.email_templates
FOR ALL
USING (public.is_superadmin(auth.uid()));

-- Management users can manage email enrollments and sends
CREATE POLICY "Management users can manage email enrollments"
ON public.email_enrollments
FOR ALL
USING (public.has_management_access(auth.uid()));

CREATE POLICY "Management users can manage email sends"
ON public.email_sends
FOR ALL
USING (public.has_management_access(auth.uid()));

-- Only superadmin for chat widget
CREATE POLICY "Superadmin can manage chat widget config"
ON public.chat_widget_config
FOR ALL
USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Superadmin can manage chat widget Q&A"
ON public.chat_widget_qa
FOR ALL
USING (public.is_superadmin(auth.uid()));

-- Only superadmin for content briefs
CREATE POLICY "Superadmin can manage content briefs"
ON public.content_briefs
FOR ALL
USING (public.is_superadmin(auth.uid()));

-- Management users can manage contact submissions
CREATE POLICY "Management users can manage contact submissions"
ON public.chat_contact_submissions
FOR ALL
USING (public.has_management_access(auth.uid()));

-- Management users can manage call bookings
CREATE POLICY "Management users can manage call bookings"
ON public.call_bookings
FOR ALL
USING (public.has_management_access(auth.uid()));