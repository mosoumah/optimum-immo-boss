
-- 1. Revenus: explicit immutability policy
CREATE POLICY "Revenus are immutable"
  ON public.revenus FOR UPDATE
  TO authenticated
  USING (false);

-- 2. Entreprises: restrict UPDATE to admin only
DROP POLICY IF EXISTS "Users can update their entreprise" ON public.entreprises;
CREATE POLICY "Admins can update their entreprise"
  ON public.entreprises FOR UPDATE
  TO authenticated
  USING (id = get_user_entreprise_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));

-- 3. User roles: explicit deny INSERT/DELETE to prevent privilege escalation
CREATE POLICY "User roles insert denied"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "User roles delete denied"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (false);

-- 4. Logos storage: restrict to entreprise folder
DROP POLICY IF EXISTS "Users can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete logos" ON storage.objects;

CREATE POLICY "Users can upload logos to their entreprise folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'logos' AND
    (storage.foldername(name))[1] = (
      SELECT entreprise_id::text 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their entreprise logos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'logos' AND
    (storage.foldername(name))[1] = (
      SELECT entreprise_id::text 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their entreprise logos"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'logos' AND
    (storage.foldername(name))[1] = (
      SELECT entreprise_id::text 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  );
