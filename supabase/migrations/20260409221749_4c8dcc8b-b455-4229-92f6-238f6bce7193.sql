
-- 1. Fix profile UPDATE policy to prevent entreprise_id manipulation
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND entreprise_id IS NOT DISTINCT FROM (SELECT p.entreprise_id FROM public.profiles p WHERE p.id = auth.uid())
  );

-- 2. Add UPDATE policy for studio-ia storage bucket
CREATE POLICY "Users can update files in their entreprise folder studio-ia"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'studio-ia'
    AND (storage.foldername(name))[1] = 'originals'
    AND (storage.foldername(name))[2] = get_user_entreprise_id(auth.uid())::text
  );
