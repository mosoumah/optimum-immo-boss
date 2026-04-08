
-- 1. Drop existing permissive deny policies on user_roles
DROP POLICY IF EXISTS "User roles insert denied" ON public.user_roles;
DROP POLICY IF EXISTS "User roles update denied" ON public.user_roles;
DROP POLICY IF EXISTS "User roles delete denied" ON public.user_roles;

-- Recreate as RESTRICTIVE
CREATE POLICY "User roles insert denied"
  ON public.user_roles AS RESTRICTIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "User roles update denied"
  ON public.user_roles AS RESTRICTIVE
  FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY "User roles delete denied"
  ON public.user_roles AS RESTRICTIVE
  FOR DELETE
  TO authenticated
  USING (false);

-- 2. Remove old permissive studio-ia upload policy
DROP POLICY IF EXISTS "Authenticated users can upload to studio-ia" ON storage.objects;
