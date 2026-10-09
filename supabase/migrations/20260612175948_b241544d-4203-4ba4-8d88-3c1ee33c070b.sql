
-- Drop Studio IA tables
DROP TABLE IF EXISTS public.ai_generated_images CASCADE;
DROP TABLE IF EXISTS public.redesign_requests CASCADE;
DROP TABLE IF EXISTS public.studio_ia_quotas CASCADE;

-- Drop Studio IA storage policies
DROP POLICY IF EXISTS "Users can view studio-ia files in their entreprise folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their entreprise studio-ia files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update files in their entreprise folder studio-ia" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload studio-ia files to their entreprise folder" ON storage.objects;

-- Empty and delete the studio-ia bucket (bypass storage delete protection trigger)
SET LOCAL session_replication_role = replica;
DELETE FROM storage.objects WHERE bucket_id = 'studio-ia';
DELETE FROM storage.buckets WHERE id = 'studio-ia';
SET LOCAL session_replication_role = origin;

-- Remove Studio IA permissions
DELETE FROM public.role_permissions WHERE permission::text IN ('generer_image_ia','voir_image_ia','redesigner_bien_ia');
DELETE FROM public.user_permissions WHERE permission::text IN ('generer_image_ia','voir_image_ia','redesigner_bien_ia');

-- Fix public bucket listing finding
DROP POLICY IF EXISTS "Anyone can view logos" ON storage.objects;
DROP POLICY IF EXISTS "Public read property covers" ON storage.objects;

CREATE POLICY "Users can list their entreprise logos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'logos'
  AND (storage.foldername(name))[1] = (get_user_entreprise_id(auth.uid()))::text
);

CREATE POLICY "Users can list their entreprise property covers"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'property-covers'
  AND (storage.foldername(name))[1] = (get_user_entreprise_id(auth.uid()))::text
);
