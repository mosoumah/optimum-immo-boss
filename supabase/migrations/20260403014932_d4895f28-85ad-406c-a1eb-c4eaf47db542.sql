
-- 1. Fix handle_facture_paid_global: use CURRENT_DATE instead of NEW.date
CREATE OR REPLACE FUNCTION public.handle_facture_paid_global()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.statut = 'paye' AND (OLD.statut IS NULL OR OLD.statut != 'paye') THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.revenus WHERE facture_id = NEW.id
    ) THEN
      INSERT INTO public.revenus (facture_id, entreprise_id, montant, date, source_type, reservation_id)
      VALUES (NEW.id, NEW.entreprise_id, NEW.montant, CURRENT_DATE, 'facture', NEW.reservation_id);
    END IF;

    IF NEW.reservation_id IS NOT NULL THEN
      UPDATE public.reservations
      SET montant_paye = montant_total,
          updated_at = now()
      WHERE id = NEW.reservation_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Restrict DELETE on factures to admin only
DROP POLICY IF EXISTS "Role-based factures delete" ON public.factures;

CREATE POLICY "Admin-only factures delete"
ON public.factures
FOR DELETE
USING (
  entreprise_id = get_user_entreprise_id(auth.uid())
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- 3. Cascade delete: when a facture is deleted, remove associated revenus
CREATE OR REPLACE FUNCTION public.handle_facture_deleted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.revenus WHERE facture_id = OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_facture_deleted ON public.factures;

CREATE TRIGGER on_facture_deleted
BEFORE DELETE ON public.factures
FOR EACH ROW
EXECUTE FUNCTION public.handle_facture_deleted();
