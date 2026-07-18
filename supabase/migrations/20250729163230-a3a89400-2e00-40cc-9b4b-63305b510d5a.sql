-- Step 1: Fix Critical Privilege Escalation
-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('superadmin', 'lender', 'broker', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user has any management role
CREATE OR REPLACE FUNCTION public.has_any_management_role(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('superadmin', 'lender', 'broker')
  )
$$;

-- Create function to check if user is superadmin
CREATE OR REPLACE FUNCTION public.is_user_superadmin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'superadmin'
  )
$$;

-- Step 3: Role Management Security Policies
-- Only superadmins can view all role assignments
CREATE POLICY "Superadmins can view all user roles"
ON public.user_roles
FOR SELECT
USING (public.is_user_superadmin(auth.uid()));

-- Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Only superadmins can assign roles
CREATE POLICY "Only superadmins can assign roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.is_user_superadmin(auth.uid()));

-- Only superadmins can update roles
CREATE POLICY "Only superadmins can update roles"
ON public.user_roles
FOR UPDATE
USING (public.is_user_superadmin(auth.uid()));

-- Only superadmins can delete roles
CREATE POLICY "Only superadmins can delete roles"
ON public.user_roles
FOR DELETE
USING (public.is_user_superadmin(auth.uid()));

-- Migrate existing roles from profiles table
INSERT INTO public.user_roles (user_id, role, assigned_at)
SELECT user_id, role::app_role, created_at
FROM public.profiles
WHERE role IS NOT NULL;

-- Update existing database functions to use new role system
DROP FUNCTION IF EXISTS public.has_management_access(UUID);
DROP FUNCTION IF EXISTS public.is_superadmin(UUID);

CREATE OR REPLACE FUNCTION public.has_management_access(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT public.has_any_management_role(user_id_param)
$$;

CREATE OR REPLACE FUNCTION public.is_superadmin(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT public.is_user_superadmin(user_id_param)
$$;

-- Add audit logging for role changes
CREATE TABLE public.role_change_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  old_role app_role,
  new_role app_role,
  changed_by UUID NOT NULL,
  change_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on audit table
ALTER TABLE public.role_change_audit ENABLE ROW LEVEL SECURITY;

-- Only superadmins can view audit logs
CREATE POLICY "Only superadmins can view role audit logs"
ON public.role_change_audit
FOR SELECT
USING (public.is_user_superadmin(auth.uid()));

-- Trigger function for role change auditing
CREATE OR REPLACE FUNCTION public.audit_role_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.role_change_audit (user_id, old_role, new_role, changed_by, change_reason)
    VALUES (NEW.user_id, NULL, NEW.role, auth.uid(), 'Role assigned');
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.role_change_audit (user_id, old_role, new_role, changed_by, change_reason)
    VALUES (NEW.user_id, OLD.role, NEW.role, auth.uid(), 'Role updated');
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.role_change_audit (user_id, old_role, new_role, changed_by, change_reason)
    VALUES (OLD.user_id, OLD.role, NULL, auth.uid(), 'Role removed');
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create triggers for role change auditing
CREATE TRIGGER user_roles_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_role_changes();

-- Add updated_at trigger for user_roles
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();