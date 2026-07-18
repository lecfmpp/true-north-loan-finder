-- Assign superadmin role to lecfmpp@gmail.com
INSERT INTO public.user_roles (user_id, role, assigned_by)
VALUES (
  '47621a5d-4268-4de1-8ec7-d53756b7cfb9'::uuid, 
  'superadmin'::app_role,
  '47621a5d-4268-4de1-8ec7-d53756b7cfb9'::uuid
)
ON CONFLICT (user_id, role) DO NOTHING;