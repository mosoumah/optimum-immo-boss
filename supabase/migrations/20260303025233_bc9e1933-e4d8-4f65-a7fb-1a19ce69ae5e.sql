
-- 1. Recreate v_dashboard_simple with sejours_en_cours
DROP VIEW IF EXISTS public.v_dashboard_simple;
CREATE VIEW public.v_dashboard_simple WITH (security_invoker = true) AS
SELECT e.id AS entreprise_id,
    COALESCE(r.total_revenus, 0::numeric) AS revenus_mois,
    COALESCE(d.total_depenses, 0::numeric) AS depenses_mois,
    COALESCE(r.total_revenus, 0::numeric) - COALESCE(d.total_depenses, 0::numeric) AS benefice_estime,
    COALESCE(f.factures_impayees, 0::bigint) AS factures_impayees,
    COALESCE(res_arr.arrivees, 0::bigint) AS arrivees_aujourdhui,
    COALESCE(res_dep.departs, 0::bigint) AS departs_aujourdhui,
    COALESCE(t.taches_urgentes, 0::bigint) AS taches_urgentes,
    COALESCE(f.montant_impaye, 0::numeric) AS paiements_attendus,
    COALESCE(sc.sejours_en_cours, 0::bigint) AS sejours_en_cours
   FROM entreprises e
     LEFT JOIN LATERAL ( SELECT sum(revenus.montant) AS total_revenus
           FROM revenus
          WHERE revenus.entreprise_id = e.id AND revenus.date >= date_trunc('month'::text, CURRENT_DATE::timestamp with time zone)) r ON true
     LEFT JOIN LATERAL ( SELECT sum(depenses.montant) AS total_depenses
           FROM depenses
          WHERE depenses.entreprise_id = e.id AND depenses.date >= date_trunc('month'::text, CURRENT_DATE::timestamp with time zone)) d ON true
     LEFT JOIN LATERAL ( SELECT count(*) AS factures_impayees,
            sum(factures.montant) AS montant_impaye
           FROM factures
          WHERE factures.entreprise_id = e.id AND factures.statut = 'non_paye'::facture_statut) f ON true
     LEFT JOIN LATERAL ( SELECT count(*) AS arrivees
           FROM reservations
          WHERE reservations.entreprise_id = e.id AND reservations.date_arrivee = CURRENT_DATE AND reservations.statut = 'confirmee'::text) res_arr ON true
     LEFT JOIN LATERAL ( SELECT count(*) AS departs
           FROM reservations
          WHERE reservations.entreprise_id = e.id AND reservations.date_depart = CURRENT_DATE) res_dep ON true
     LEFT JOIN LATERAL ( SELECT count(*) AS taches_urgentes
           FROM taches
          WHERE taches.entreprise_id = e.id AND taches.date = CURRENT_DATE AND taches.statut = 'a_faire'::tache_statut) t ON true
     LEFT JOIN LATERAL ( SELECT count(*) AS sejours_en_cours
           FROM reservations
          WHERE reservations.entreprise_id = e.id
            AND reservations.statut IN ('en_cours', 'confirmee')
            AND reservations.date_arrivee <= CURRENT_DATE
            AND reservations.date_depart >= CURRENT_DATE) sc ON true;

-- 2. Trigger to auto-update property status on reservation changes
CREATE OR REPLACE FUNCTION public.handle_reservation_property_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Skip if no property linked
  IF NEW.property_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.statut IN ('confirmee', 'en_cours') THEN
    UPDATE public.properties SET statut = 'reserve', updated_at = now() WHERE id = NEW.property_id;
  ELSIF NEW.statut IN ('terminee', 'annulee') THEN
    -- Only set back to disponible if no other active reservation exists for this property
    IF NOT EXISTS (
      SELECT 1 FROM public.reservations
      WHERE property_id = NEW.property_id
        AND id != NEW.id
        AND statut IN ('confirmee', 'en_cours')
    ) THEN
      UPDATE public.properties SET statut = 'disponible', updated_at = now() WHERE id = NEW.property_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_reservation_property_status
  AFTER INSERT OR UPDATE ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_reservation_property_status();

-- 3. Update auto_complete_reservations to also reset property status
CREATE OR REPLACE FUNCTION public.auto_complete_reservations(_entreprise_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _res RECORD;
  _facture_payee BOOLEAN;
BEGIN
  FOR _res IN
    SELECT id, client_id, entreprise_id, property_name, property_id
    FROM public.reservations
    WHERE entreprise_id = _entreprise_id
      AND statut = 'en_cours'
      AND date_depart < CURRENT_DATE
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM public.factures
      WHERE client_id = _res.client_id
        AND entreprise_id = _res.entreprise_id
        AND statut = 'paye'
        AND description ILIKE '%' || _res.property_name || '%'
    ) INTO _facture_payee;

    IF _facture_payee THEN
      UPDATE public.reservations
      SET statut = 'terminee', updated_at = now()
      WHERE id = _res.id;

      -- Reset property status if no other active reservation
      IF _res.property_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.reservations
        WHERE property_id = _res.property_id
          AND id != _res.id
          AND statut IN ('confirmee', 'en_cours')
      ) THEN
        UPDATE public.properties SET statut = 'disponible', updated_at = now()
        WHERE id = _res.property_id;
      END IF;
    END IF;
  END LOOP;
END;
$$;
