
-- Create reservations table
CREATE TABLE public.reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise_id uuid NOT NULL,
  client_id uuid NOT NULL,
  property_name text NOT NULL,
  type_location text NOT NULL,
  date_arrivee date NOT NULL,
  date_depart date NOT NULL,
  prix_unitaire numeric NOT NULL DEFAULT 0,
  montant_total numeric NOT NULL DEFAULT 0,
  montant_paye numeric NOT NULL DEFAULT 0,
  caution numeric NOT NULL DEFAULT 0,
  statut text NOT NULL DEFAULT 'confirmee',
  generer_facture boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- RLS: Admin sees all reservations in their entreprise, Agent sees only assigned clients' reservations
CREATE POLICY "Role-based reservations access"
ON public.reservations FOR SELECT
USING (
  CASE get_user_role(auth.uid())
    WHEN 'admin' THEN entreprise_id = get_user_entreprise_id(auth.uid())
    WHEN 'agent' THEN (
      entreprise_id = get_user_entreprise_id(auth.uid())
      AND client_id IN (
        SELECT id FROM public.clients WHERE assigned_to = auth.uid()
      )
    )
    ELSE false
  END
);

CREATE POLICY "Role-based reservations insert"
ON public.reservations FOR INSERT
WITH CHECK (
  entreprise_id = get_user_entreprise_id(auth.uid())
  AND get_user_role(auth.uid()) IN ('admin', 'agent')
);

CREATE POLICY "Role-based reservations update"
ON public.reservations FOR UPDATE
USING (
  CASE get_user_role(auth.uid())
    WHEN 'admin' THEN entreprise_id = get_user_entreprise_id(auth.uid())
    WHEN 'agent' THEN (
      entreprise_id = get_user_entreprise_id(auth.uid())
      AND client_id IN (
        SELECT id FROM public.clients WHERE assigned_to = auth.uid()
      )
    )
    ELSE false
  END
);

CREATE POLICY "Role-based reservations delete"
ON public.reservations FOR DELETE
USING (
  CASE get_user_role(auth.uid())
    WHEN 'admin' THEN entreprise_id = get_user_entreprise_id(auth.uid())
    WHEN 'agent' THEN (
      entreprise_id = get_user_entreprise_id(auth.uid())
      AND client_id IN (
        SELECT id FROM public.clients WHERE assigned_to = auth.uid()
      )
    )
    ELSE false
  END
);

-- Trigger for updated_at
CREATE TRIGGER update_reservations_updated_at
BEFORE UPDATE ON public.reservations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
