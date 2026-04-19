-- =====================================================
-- Migration : FK manquantes + index de performance
-- =====================================================

-- 1. FK manquantes sur properties
ALTER TABLE public.properties
  ADD CONSTRAINT properties_entreprise_id_fkey
    FOREIGN KEY (entreprise_id) REFERENCES public.entreprises(id) ON DELETE CASCADE,
  ADD CONSTRAINT properties_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. FK manquante sur reservations.property_id
ALTER TABLE public.reservations
  ADD CONSTRAINT reservations_property_id_fkey
    FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE SET NULL;

-- 3. FK manquantes sur sales_transactions
ALTER TABLE public.sales_transactions
  ADD CONSTRAINT sales_transactions_entreprise_id_fkey
    FOREIGN KEY (entreprise_id) REFERENCES public.entreprises(id) ON DELETE CASCADE,
  ADD CONSTRAINT sales_transactions_client_id_fkey
    FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE RESTRICT,
  ADD CONSTRAINT sales_transactions_property_id_fkey
    FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE RESTRICT,
  ADD CONSTRAINT sales_transactions_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 4. Index sur les colonnes de filtrage critiques
CREATE INDEX IF NOT EXISTS idx_clients_entreprise_id        ON public.clients(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_properties_entreprise_id     ON public.properties(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_properties_statut            ON public.properties(entreprise_id, statut);
CREATE INDEX IF NOT EXISTS idx_reservations_entreprise_id   ON public.reservations(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_reservations_property_id     ON public.reservations(property_id);
CREATE INDEX IF NOT EXISTS idx_reservations_client_id       ON public.reservations(client_id);
CREATE INDEX IF NOT EXISTS idx_reservations_statut          ON public.reservations(entreprise_id, statut);
CREATE INDEX IF NOT EXISTS idx_factures_entreprise_id       ON public.factures(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_factures_client_id           ON public.factures(client_id);
CREATE INDEX IF NOT EXISTS idx_revenus_entreprise_id        ON public.revenus(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_revenus_date                 ON public.revenus(entreprise_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_depenses_entreprise_id       ON public.depenses(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_taches_entreprise_id         ON public.taches(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_sales_txn_entreprise_id      ON public.sales_transactions(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_sales_txn_client_id          ON public.sales_transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_devis_entreprise_id          ON public.devis(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_tache_messages_tache_id      ON public.tache_messages(tache_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_entreprise   ON public.direct_messages(entreprise_id);
