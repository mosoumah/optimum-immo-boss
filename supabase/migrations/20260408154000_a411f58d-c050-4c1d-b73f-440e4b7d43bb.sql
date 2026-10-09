
-- 1. Remove sensitive financial tables from Realtime publication
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'factures'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.factures;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'revenus'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.revenus;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'depenses'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.depenses;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'reservations'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.reservations;
  END IF;
END $$;

-- 2. User roles: explicit UPDATE deny
CREATE POLICY "User roles update denied"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (false);

-- 3. Studio-IA storage: replace permissive policies with entreprise-scoped ones
DROP POLICY IF EXISTS "Users can upload studio-ia files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their studio-ia files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update studio-ia files" ON storage.objects;

CREATE POLICY "Users can upload studio-ia files to their entreprise folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'studio-ia' AND
    (storage.foldername(name))[2] = (
      SELECT entreprise_id::text 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their entreprise studio-ia files"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'studio-ia' AND
    (storage.foldername(name))[2] = (
      SELECT entreprise_id::text 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  );
