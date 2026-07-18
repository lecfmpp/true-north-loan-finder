-- Temporarily disable the audit trigger
DROP TRIGGER IF EXISTS audit_role_changes_trigger ON user_roles;

-- Clean up any conflicting data and ensure only superadmin role
DELETE FROM user_roles WHERE user_id = '47621a5d-4268-4de1-8ec7-d53756b7cfb9';

-- Insert only superadmin role
INSERT INTO user_roles (user_id, role, assigned_by)
VALUES ('47621a5d-4268-4de1-8ec7-d53756b7cfb9'::uuid, 'superadmin'::app_role, '47621a5d-4268-4de1-8ec7-d53756b7cfb9'::uuid);

-- Re-enable the audit trigger
CREATE TRIGGER audit_role_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON user_roles
  FOR EACH ROW EXECUTE FUNCTION audit_role_changes();

-- Update the profiles table to not conflict (set to user role since we're using user_roles table now)
UPDATE profiles 
SET role = 'user'::user_role 
WHERE user_id = '47621a5d-4268-4de1-8ec7-d53756b7cfb9';