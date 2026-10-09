-- Fix update_updated_at_column function with search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix handle_facture_paid function with search_path
CREATE OR REPLACE FUNCTION public.handle_facture_paid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.statut = 'paye' AND (OLD.statut IS NULL OR OLD.statut != 'paye') THEN
    INSERT INTO public.revenus (facture_id, entreprise_id, montant, date)
    VALUES (NEW.id, NEW.entreprise_id, NEW.montant, CURRENT_DATE);
  END IF;
  RETURN NEW;
END;
$$;