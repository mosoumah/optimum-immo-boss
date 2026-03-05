ALTER TABLE public.revenus ADD COLUMN source text;
ALTER TABLE public.revenus ALTER COLUMN facture_id DROP NOT NULL;