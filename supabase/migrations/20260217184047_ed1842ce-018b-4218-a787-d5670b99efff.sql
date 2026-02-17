
-- Table: ai_generated_images
CREATE TABLE public.ai_generated_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise_id uuid NOT NULL REFERENCES public.entreprises(id),
  created_by uuid NOT NULL,
  format text NOT NULL DEFAULT 'instagram_post',
  prompt_used text NOT NULL,
  image_url text NOT NULL,
  bien_description text NOT NULL,
  prix text,
  mention text NOT NULL DEFAULT 'Disponible',
  include_logo boolean NOT NULL DEFAULT false,
  include_phone boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_generated_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their entreprise images"
ON public.ai_generated_images FOR SELECT
USING (entreprise_id = get_user_entreprise_id(auth.uid()) AND get_user_role(auth.uid()) IN ('admin', 'agent'));

CREATE POLICY "Users can insert images for their entreprise"
ON public.ai_generated_images FOR INSERT
WITH CHECK (entreprise_id = get_user_entreprise_id(auth.uid()) AND get_user_role(auth.uid()) IN ('admin', 'agent'));

CREATE POLICY "Users can delete their entreprise images"
ON public.ai_generated_images FOR DELETE
USING (entreprise_id = get_user_entreprise_id(auth.uid()) AND get_user_role(auth.uid()) IN ('admin', 'agent'));

-- Table: redesign_requests
CREATE TABLE public.redesign_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise_id uuid NOT NULL REFERENCES public.entreprises(id),
  created_by uuid NOT NULL,
  original_image_url text NOT NULL,
  result_image_url text,
  instruction text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.redesign_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their entreprise redesigns"
ON public.redesign_requests FOR SELECT
USING (entreprise_id = get_user_entreprise_id(auth.uid()) AND get_user_role(auth.uid()) IN ('admin', 'agent'));

CREATE POLICY "Users can insert redesigns for their entreprise"
ON public.redesign_requests FOR INSERT
WITH CHECK (entreprise_id = get_user_entreprise_id(auth.uid()) AND get_user_role(auth.uid()) IN ('admin', 'agent'));

CREATE POLICY "Users can update their entreprise redesigns"
ON public.redesign_requests FOR UPDATE
USING (entreprise_id = get_user_entreprise_id(auth.uid()) AND get_user_role(auth.uid()) IN ('admin', 'agent'));

CREATE POLICY "Users can delete their entreprise redesigns"
ON public.redesign_requests FOR DELETE
USING (entreprise_id = get_user_entreprise_id(auth.uid()) AND get_user_role(auth.uid()) IN ('admin', 'agent'));

-- Table: studio_ia_quotas
CREATE TABLE public.studio_ia_quotas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise_id uuid NOT NULL REFERENCES public.entreprises(id) UNIQUE,
  plan text NOT NULL DEFAULT 'standard',
  generations_used integer NOT NULL DEFAULT 0,
  month_year text NOT NULL DEFAULT to_char(now(), 'YYYY-MM'),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.studio_ia_quotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their entreprise quota"
ON public.studio_ia_quotas FOR SELECT
USING (entreprise_id = get_user_entreprise_id(auth.uid()) AND get_user_role(auth.uid()) IN ('admin', 'agent'));

CREATE POLICY "Users can insert quota for their entreprise"
ON public.studio_ia_quotas FOR INSERT
WITH CHECK (entreprise_id = get_user_entreprise_id(auth.uid()) AND get_user_role(auth.uid()) IN ('admin', 'agent'));

CREATE POLICY "Users can update their entreprise quota"
ON public.studio_ia_quotas FOR UPDATE
USING (entreprise_id = get_user_entreprise_id(auth.uid()) AND get_user_role(auth.uid()) IN ('admin', 'agent'));

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('studio-ia', 'studio-ia', true);

CREATE POLICY "Anyone can view studio-ia files"
ON storage.objects FOR SELECT
USING (bucket_id = 'studio-ia');

CREATE POLICY "Authenticated users can upload to studio-ia"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'studio-ia' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their studio-ia files"
ON storage.objects FOR DELETE
USING (bucket_id = 'studio-ia' AND auth.role() = 'authenticated');
