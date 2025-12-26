-- Update the handle_facture_paid function to use the invoice date and prevent duplicates
CREATE OR REPLACE FUNCTION public.handle_facture_paid()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only insert revenue if status changed to 'paye' and no revenue exists for this invoice yet
  IF NEW.statut = 'paye' AND (OLD.statut IS NULL OR OLD.statut != 'paye') THEN
    -- Check if revenue already exists for this invoice
    IF NOT EXISTS (SELECT 1 FROM public.revenus WHERE facture_id = NEW.id) THEN
      INSERT INTO public.revenus (facture_id, entreprise_id, montant, date)
      VALUES (NEW.id, NEW.entreprise_id, NEW.montant, NEW.date);
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;