
-- 1. Add reservation_id column to factures
ALTER TABLE public.factures 
ADD COLUMN reservation_id uuid REFERENCES public.reservations(id) ON DELETE SET NULL;

-- 2. Create trigger function to sync payment when facture is paid
CREATE OR REPLACE FUNCTION public.handle_reservation_payment_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- When a facture linked to a reservation is marked as paid
  IF NEW.reservation_id IS NOT NULL 
     AND NEW.statut = 'paye' 
     AND (OLD.statut IS NULL OR OLD.statut != 'paye') THEN
    UPDATE public.reservations
    SET montant_paye = montant_total, updated_at = now()
    WHERE id = NEW.reservation_id;
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Create trigger on factures table
CREATE TRIGGER on_facture_paid_sync_reservation
  AFTER UPDATE ON public.factures
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_reservation_payment_sync();

-- 4. Fix existing data: match factures to reservations by description pattern
UPDATE public.factures f
SET reservation_id = r.id
FROM public.reservations r
WHERE f.reservation_id IS NULL
  AND f.client_id = r.client_id
  AND f.entreprise_id = r.entreprise_id
  AND f.description ILIKE '%' || r.property_name || '%'
  AND f.description ILIKE '%Location%';

-- 5. Fix existing reservations where linked facture is already paid
UPDATE public.reservations r
SET montant_paye = r.montant_total, updated_at = now()
FROM public.factures f
WHERE f.reservation_id = r.id
  AND f.statut = 'paye'
  AND r.montant_paye < r.montant_total;
