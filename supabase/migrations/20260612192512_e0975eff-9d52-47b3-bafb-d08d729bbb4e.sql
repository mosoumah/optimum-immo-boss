
-- 1. Extend properties with new optional fields
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS description_longue text,
  ADD COLUMN IF NOT EXISTS quartier text,
  ADD COLUMN IF NOT EXISTS commune text,
  ADD COLUMN IF NOT EXISTS ville text,
  ADD COLUMN IF NOT EXISTS chambres integer,
  ADD COLUMN IF NOT EXISTS salons integer,
  ADD COLUMN IF NOT EXISTS salles_bain integer,
  ADD COLUMN IF NOT EXISTS cuisine boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS parking boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS balcon boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS piscine boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS internet boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS climatisation boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS meuble boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS video_url text;

-- 2. property_media table for gallery, documents and uploaded videos
CREATE TABLE IF NOT EXISTS public.property_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL,
  entreprise_id uuid NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('image','document','video')),
  bucket text NOT NULL,
  storage_path text NOT NULL,
  nom_fichier text NOT NULL,
  taille_octets bigint,
  is_cover boolean NOT NULL DEFAULT false,
  ordre integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_property_media_property ON public.property_media(property_id);
CREATE INDEX IF NOT EXISTS idx_property_media_entreprise ON public.property_media(entreprise_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_media TO authenticated;
GRANT ALL ON public.property_media TO service_role;

ALTER TABLE public.property_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "property_media_select" ON public.property_media
  FOR SELECT TO authenticated
  USING (entreprise_id = public.get_user_entreprise_id(auth.uid()));

CREATE POLICY "property_media_insert" ON public.property_media
  FOR INSERT TO authenticated
  WITH CHECK (entreprise_id = public.get_user_entreprise_id(auth.uid()));

CREATE POLICY "property_media_update" ON public.property_media
  FOR UPDATE TO authenticated
  USING (entreprise_id = public.get_user_entreprise_id(auth.uid()))
  WITH CHECK (entreprise_id = public.get_user_entreprise_id(auth.uid()));

CREATE POLICY "property_media_delete" ON public.property_media
  FOR DELETE TO authenticated
  USING (entreprise_id = public.get_user_entreprise_id(auth.uid()));

CREATE TRIGGER trg_property_media_updated_at
  BEFORE UPDATE ON public.property_media
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Trigger: enforce single cover per property
CREATE OR REPLACE FUNCTION public.handle_property_media_cover()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_cover = true AND NEW.media_type = 'image' THEN
    UPDATE public.property_media
    SET is_cover = false
    WHERE property_id = NEW.property_id
      AND id <> NEW.id
      AND is_cover = true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_property_media_single_cover
  AFTER INSERT OR UPDATE OF is_cover ON public.property_media
  FOR EACH ROW
  WHEN (NEW.is_cover = true)
  EXECUTE FUNCTION public.handle_property_media_cover();

-- 4. RLS policies on storage.objects for the three new buckets
CREATE POLICY "property_gallery_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'property-gallery' AND (storage.foldername(name))[1] = public.get_user_entreprise_id(auth.uid())::text);

CREATE POLICY "property_gallery_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'property-gallery' AND (storage.foldername(name))[1] = public.get_user_entreprise_id(auth.uid())::text);

CREATE POLICY "property_gallery_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'property-gallery' AND (storage.foldername(name))[1] = public.get_user_entreprise_id(auth.uid())::text);

CREATE POLICY "property_gallery_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'property-gallery' AND (storage.foldername(name))[1] = public.get_user_entreprise_id(auth.uid())::text);

CREATE POLICY "property_documents_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'property-documents' AND (storage.foldername(name))[1] = public.get_user_entreprise_id(auth.uid())::text);

CREATE POLICY "property_documents_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'property-documents' AND (storage.foldername(name))[1] = public.get_user_entreprise_id(auth.uid())::text);

CREATE POLICY "property_documents_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'property-documents' AND (storage.foldername(name))[1] = public.get_user_entreprise_id(auth.uid())::text);

CREATE POLICY "property_documents_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'property-documents' AND (storage.foldername(name))[1] = public.get_user_entreprise_id(auth.uid())::text);

CREATE POLICY "property_videos_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'property-videos' AND (storage.foldername(name))[1] = public.get_user_entreprise_id(auth.uid())::text);

CREATE POLICY "property_videos_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'property-videos' AND (storage.foldername(name))[1] = public.get_user_entreprise_id(auth.uid())::text);

CREATE POLICY "property_videos_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'property-videos' AND (storage.foldername(name))[1] = public.get_user_entreprise_id(auth.uid())::text);

CREATE POLICY "property_videos_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'property-videos' AND (storage.foldername(name))[1] = public.get_user_entreprise_id(auth.uid())::text);
