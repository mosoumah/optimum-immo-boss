-- =====================================================
-- Migration : FK manquantes + index de performance
-- Utilise des blocs DO pour ignorer si déjà existant
-- =====================================================

DO $$ BEGIN

  -- 1. FK sur properties (seulement si la table existe)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'properties') THEN

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'properties_entreprise_id_fkey') THEN
      ALTER TABLE public.properties
        ADD CONSTRAINT properties_entreprise_id_fkey
          FOREIGN KEY (entreprise_id) REFERENCES public.entreprises(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'properties_created_by_fkey') THEN
      ALTER TABLE public.properties
        ADD CONSTRAINT properties_created_by_fkey
          FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;

  END IF;

  -- 2. FK sur reservations.property_id
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reservations')
  AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'properties') THEN

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reservations_property_id_fkey') THEN
      ALTER TABLE public.reservations
        ADD CONSTRAINT reservations_property_id_fkey
          FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE SET NULL;
    END IF;

  END IF;

  -- 3. FK sur sales_transactions
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sales_transactions') THEN

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_transactions_entreprise_id_fkey') THEN
      ALTER TABLE public.sales_transactions
        ADD CONSTRAINT sales_transactions_entreprise_id_fkey
          FOREIGN KEY (entreprise_id) REFERENCES public.entreprises(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_transactions_client_id_fkey') THEN
      ALTER TABLE public.sales_transactions
        ADD CONSTRAINT sales_transactions_client_id_fkey
          FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE RESTRICT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_transactions_property_id_fkey')
    AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'properties') THEN
      ALTER TABLE public.sales_transactions
        ADD CONSTRAINT sales_transactions_property_id_fkey
          FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE RESTRICT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_transactions_created_by_fkey') THEN
      ALTER TABLE public.sales_transactions
        ADD CONSTRAINT sales_transactions_created_by_fkey
          FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;

  END IF;

END $$;

-- 4. Index sur les colonnes de filtrage (IF NOT EXISTS = sans erreur si déjà présent)
CREATE INDEX IF NOT EXISTS idx_clients_entreprise_id        ON public.clients(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_factures_entreprise_id       ON public.factures(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_factures_client_id           ON public.factures(client_id);
CREATE INDEX IF NOT EXISTS idx_revenus_entreprise_id        ON public.revenus(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_revenus_date                 ON public.revenus(entreprise_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_depenses_entreprise_id       ON public.depenses(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_taches_entreprise_id         ON public.taches(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_devis_entreprise_id          ON public.devis(entreprise_id);

-- Index conditionnels (tables créées plus tard dans les migrations)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='properties') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_properties_entreprise_id ON public.properties(entreprise_id)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_properties_statut ON public.properties(entreprise_id, statut)';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='reservations') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_reservations_entreprise_id ON public.reservations(entreprise_id)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_reservations_property_id ON public.reservations(property_id)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_reservations_client_id ON public.reservations(client_id)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_reservations_statut ON public.reservations(entreprise_id, statut)';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='sales_transactions') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_sales_txn_entreprise_id ON public.sales_transactions(entreprise_id)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_sales_txn_client_id ON public.sales_transactions(client_id)';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='tache_messages') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_tache_messages_tache_id ON public.tache_messages(tache_id)';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='direct_messages') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_direct_messages_entreprise ON public.direct_messages(entreprise_id)';
  END IF;
END $$;
