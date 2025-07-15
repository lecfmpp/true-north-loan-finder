-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('superadmin', 'lender', 'broker', 'user');

-- First, drop the default constraint to avoid casting issues
ALTER TABLE public.profiles ALTER COLUMN role DROP DEFAULT;

-- Update profiles table to use the new enum
ALTER TABLE public.profiles ALTER COLUMN role TYPE user_role USING role::user_role;

-- Set the new default using the enum type
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'user'::user_role;

-- Update existing admin user to superadmin
UPDATE public.profiles 
SET role = 'superadmin' 
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'lecfmpp@gmail.com'
);

-- Create function to check if user has management permissions (lender, broker, or superadmin)
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

-- Create function to check if user is superadmin
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

-- Update RLS policies for quiz_responses (leads) table
DROP POLICY IF EXISTS "Admins can view all quiz responses" ON public.quiz_responses;
DROP POLICY IF EXISTS "Admins can update quiz responses" ON public.quiz_responses;
DROP POLICY IF EXISTS "Admins can delete quiz responses" ON public.quiz_responses;

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

-- Update RLS policies for available_time_slots table
DROP POLICY IF EXISTS "Admins can manage time slots" ON public.available_time_slots;

-- Management users can manage time slots
CREATE POLICY "Management users can manage time slots"
ON public.available_time_slots
FOR ALL
USING (public.has_management_access(auth.uid()));

-- Update RLS policies for other admin tables to only allow superadmin
-- Blog posts
DROP POLICY IF EXISTS "Admins can view all blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins can create blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins can update blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins can delete blog posts" ON public.blog_posts;

CREATE POLICY "Superadmin can manage blog posts"
ON public.blog_posts
FOR ALL
USING (public.is_superadmin(auth.uid()));

-- Email sequences
DROP POLICY IF EXISTS "Admins can manage email sequences" ON public.email_sequences;
CREATE POLICY "Superadmin can manage email sequences"
ON public.email_sequences
FOR ALL
USING (public.is_superadmin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage email templates" ON public.email_templates;
CREATE POLICY "Superadmin can manage email templates"
ON public.email_templates
FOR ALL
USING (public.is_superadmin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage email enrollments" ON public.email_enrollments;
CREATE POLICY "Management users can manage email enrollments"
ON public.email_enrollments
FOR ALL
USING (public.has_management_access(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage email sends" ON public.email_sends;
CREATE POLICY "Management users can manage email sends"
ON public.email_sends
FOR ALL
USING (public.has_management_access(auth.uid()));

-- Chat widget
DROP POLICY IF EXISTS "Admins can manage chat widget config" ON public.chat_widget_config;
CREATE POLICY "Superadmin can manage chat widget config"
ON public.chat_widget_config
FOR ALL
USING (public.is_superadmin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage chat widget Q&A" ON public.chat_widget_qa;
CREATE POLICY "Superadmin can manage chat widget Q&A"
ON public.chat_widget_qa
FOR ALL
USING (public.is_superadmin(auth.uid()));

-- Content briefs
DROP POLICY IF EXISTS "Admins can view all content briefs" ON public.content_briefs;
DROP POLICY IF EXISTS "Admins can create content briefs" ON public.content_briefs;
DROP POLICY IF EXISTS "Admins can update content briefs" ON public.content_briefs;
DROP POLICY IF EXISTS "Admins can delete content briefs" ON public.content_briefs;

CREATE POLICY "Superadmin can manage content briefs"
ON public.content_briefs
FOR ALL
USING (public.is_superadmin(auth.uid()));

-- Chat contact submissions
DROP POLICY IF EXISTS "Admins can view all contact submissions" ON public.chat_contact_submissions;
DROP POLICY IF EXISTS "Admins can update contact submissions" ON public.chat_contact_submissions;
DROP POLICY IF EXISTS "Admins can delete contact submissions" ON public.chat_contact_submissions;

CREATE POLICY "Management users can manage contact submissions"
ON public.chat_contact_submissions
FOR ALL
USING (public.has_management_access(auth.uid()));

-- Call bookings
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.call_bookings;
DROP POLICY IF EXISTS "Admins can manage bookings" ON public.call_bookings;

CREATE POLICY "Management users can manage call bookings"
ON public.call_bookings
FOR ALL
USING (public.has_management_access(auth.uid()));