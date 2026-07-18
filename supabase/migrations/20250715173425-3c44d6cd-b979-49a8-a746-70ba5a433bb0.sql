-- Drop all storage policies that might reference the role column
DROP POLICY IF EXISTS "Admins can upload blog images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view blog images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage blog images" ON storage.objects;
DROP POLICY IF EXISTS "Users can insert their own profile avatar." ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile avatar." ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own profile avatar." ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder" ON storage.objects;

-- Also drop any other admin-related policies that might exist
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage profiles" ON public.profiles;