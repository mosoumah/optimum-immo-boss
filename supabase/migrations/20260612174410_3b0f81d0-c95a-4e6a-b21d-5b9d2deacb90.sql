
-- 1) Privilege escalation fix: drop client INSERT policy on profiles.
-- Profiles are created exclusively by the SECURITY DEFINER trigger handle_new_user_signup()
-- and the SECURITY DEFINER function bootstrap_current_user(), so RLS-bypassed inserts still work.
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- 2) Studio-IA storage: replace broad SELECT with entreprise-scoped policy.
DROP POLICY IF EXISTS "Anyone can view studio-ia files" ON storage.objects;

CREATE POLICY "Users can view studio-ia files in their entreprise folder"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'studio-ia'
  AND (storage.foldername(name))[1] = public.get_user_entreprise_id(auth.uid())::text
);
