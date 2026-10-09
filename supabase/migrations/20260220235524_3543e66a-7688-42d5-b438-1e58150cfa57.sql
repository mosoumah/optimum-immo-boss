
-- =============================================
-- Phase 1: Architecture Modulaire - Nouvelles tables
-- =============================================

-- 1. Table agency_settings
CREATE TABLE public.agency_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise_id uuid NOT NULL UNIQUE,
  vente_enabled boolean NOT NULL DEFAULT true,
  location_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agency_settings ENABLE ROW LEVEL SECURITY;

-- Admin: lecture + écriture
CREATE POLICY "Admin can manage agency settings"
  ON public.agency_settings
  FOR ALL
  USING (
    entreprise_id = get_user_entreprise_id(auth.uid())
    AND has_role(auth.uid(), 'admin'::app_role)
  )
  WITH CHECK (
    entreprise_id = get_user_entreprise_id(auth.uid())
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- Agent: lecture seule
CREATE POLICY "Agent can read agency settings"
  ON public.agency_settings
  FOR SELECT
  USING (
    entreprise_id = get_user_entreprise_id(auth.uid())
    AND has_role(auth.uid(), 'agent'::app_role)
  );

CREATE TRIGGER update_agency_settings_updated_at
  BEFORE UPDATE ON public.agency_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Table properties
CREATE TABLE public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise_id uuid NOT NULL,
  created_by uuid,
  nom text NOT NULL,
  adresse text,
  type_bien text NOT NULL DEFAULT 'appartement',
  surface numeric,
  prix numeric NOT NULL DEFAULT 0,
  statut text NOT NULL DEFAULT 'disponible',
  description text,
  nombre_pieces integer,
  images text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Role-based properties access"
  ON public.properties
  FOR SELECT
  USING (
    CASE get_user_role(auth.uid())
      WHEN 'admin' THEN entreprise_id = get_user_entreprise_id(auth.uid())
      WHEN 'agent' THEN entreprise_id = get_user_entreprise_id(auth.uid()) AND created_by = auth.uid()
      ELSE false
    END
  );

CREATE POLICY "Role-based properties insert"
  ON public.properties
  FOR INSERT
  WITH CHECK (
    entreprise_id = get_user_entreprise_id(auth.uid())
    AND get_user_role(auth.uid()) IN ('admin', 'agent')
  );

CREATE POLICY "Role-based properties update"
  ON public.properties
  FOR UPDATE
  USING (
    CASE get_user_role(auth.uid())
      WHEN 'admin' THEN entreprise_id = get_user_entreprise_id(auth.uid())
      WHEN 'agent' THEN entreprise_id = get_user_entreprise_id(auth.uid()) AND created_by = auth.uid()
      ELSE false
    END
  );

CREATE POLICY "Role-based properties delete"
  ON public.properties
  FOR DELETE
  USING (
    CASE get_user_role(auth.uid())
      WHEN 'admin' THEN entreprise_id = get_user_entreprise_id(auth.uid())
      WHEN 'agent' THEN entreprise_id = get_user_entreprise_id(auth.uid()) AND created_by = auth.uid()
      ELSE false
    END
  );

CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Ajouter property_id à reservations (colonne nullable)
ALTER TABLE public.reservations ADD COLUMN property_id uuid;

-- 4. Table sales_transactions
CREATE TABLE public.sales_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise_id uuid NOT NULL,
  client_id uuid NOT NULL,
  property_id uuid NOT NULL,
  created_by uuid,
  montant_vente numeric NOT NULL DEFAULT 0,
  commission numeric NOT NULL DEFAULT 0,
  date_vente date NOT NULL DEFAULT CURRENT_DATE,
  statut text NOT NULL DEFAULT 'en_cours',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sales_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Role-based sales_transactions access"
  ON public.sales_transactions
  FOR SELECT
  USING (
    CASE get_user_role(auth.uid())
      WHEN 'admin' THEN entreprise_id = get_user_entreprise_id(auth.uid())
      WHEN 'agent' THEN entreprise_id = get_user_entreprise_id(auth.uid()) AND created_by = auth.uid()
      ELSE false
    END
  );

CREATE POLICY "Role-based sales_transactions insert"
  ON public.sales_transactions
  FOR INSERT
  WITH CHECK (
    entreprise_id = get_user_entreprise_id(auth.uid())
    AND get_user_role(auth.uid()) IN ('admin', 'agent')
  );

CREATE POLICY "Role-based sales_transactions update"
  ON public.sales_transactions
  FOR UPDATE
  USING (
    CASE get_user_role(auth.uid())
      WHEN 'admin' THEN entreprise_id = get_user_entreprise_id(auth.uid())
      WHEN 'agent' THEN entreprise_id = get_user_entreprise_id(auth.uid()) AND created_by = auth.uid()
      ELSE false
    END
  );

CREATE POLICY "Role-based sales_transactions delete"
  ON public.sales_transactions
  FOR DELETE
  USING (
    CASE get_user_role(auth.uid())
      WHEN 'admin' THEN entreprise_id = get_user_entreprise_id(auth.uid())
      WHEN 'agent' THEN entreprise_id = get_user_entreprise_id(auth.uid()) AND created_by = auth.uid()
      ELSE false
    END
  );

CREATE TRIGGER update_sales_transactions_updated_at
  BEFORE UPDATE ON public.sales_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
