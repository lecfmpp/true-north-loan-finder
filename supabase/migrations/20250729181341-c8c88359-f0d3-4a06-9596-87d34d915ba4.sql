-- Update the audit function to handle null auth.uid()
CREATE OR REPLACE FUNCTION public.audit_role_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.role_change_audit (user_id, old_role, new_role, changed_by, change_reason)
    VALUES (NEW.user_id, NULL, NEW.role, COALESCE(auth.uid(), NEW.user_id), 'Role assigned');
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.role_change_audit (user_id, old_role, new_role, changed_by, change_reason)
    VALUES (NEW.user_id, OLD.role, NEW.role, COALESCE(auth.uid(), NEW.user_id), 'Role updated');
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.role_change_audit (user_id, old_role, new_role, changed_by, change_reason)
    VALUES (OLD.user_id, OLD.role, NULL, COALESCE(auth.uid(), OLD.user_id), 'Role removed');
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- Now clean up and fix the role assignment
DELETE FROM user_roles WHERE user_id = '47621a5d-4268-4de1-8ec7-d53756b7cfb9';

-- Insert only superadmin role
INSERT INTO user_roles (user_id, role, assigned_by)
VALUES ('47621a5d-4268-4de1-8ec7-d53756b7cfb9'::uuid, 'superadmin'::app_role, '47621a5d-4268-4de1-8ec7-d53756b7cfb9'::uuid);

-- Update the profiles table to not conflict (set to user role since we're using user_roles table now)
UPDATE profiles 
SET role = 'user'::user_role 
WHERE user_id = '47621a5d-4268-4de1-8ec7-d53756b7cfb9';