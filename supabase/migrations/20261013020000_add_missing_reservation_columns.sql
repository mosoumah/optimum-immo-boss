ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS caution numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS prix_unitaire numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS generer_facture boolean NOT NULL DEFAULT false;

NOTIFY pgrst, 'reload schema';
