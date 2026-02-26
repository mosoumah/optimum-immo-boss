
-- 1. Add cover_image_url column to properties
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS cover_image_url text;

-- 2. Create property-covers bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-covers', 'property-covers', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage RLS policies
-- SELECT: public bucket, everyone can read
CREATE POLICY "Public read property covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'property-covers');

-- INSERT: admin/agent can upload to their entreprise folder
CREATE POLICY "Authenticated users can upload property covers"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'property-covers'
  AND get_user_role(auth.uid()) IN ('admin', 'agent')
  AND (storage.foldername(name))[1] = get_user_entreprise_id(auth.uid())::text
);

-- UPDATE: admin/agent can replace in their entreprise folder
CREATE POLICY "Authenticated users can update property covers"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'property-covers'
  AND get_user_role(auth.uid()) IN ('admin', 'agent')
  AND (storage.foldername(name))[1] = get_user_entreprise_id(auth.uid())::text
);

-- DELETE: admin/agent can delete from their entreprise folder
CREATE POLICY "Authenticated users can delete property covers"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'property-covers'
  AND get_user_role(auth.uid()) IN ('admin', 'agent')
  AND (storage.foldername(name))[1] = get_user_entreprise_id(auth.uid())::text
);
