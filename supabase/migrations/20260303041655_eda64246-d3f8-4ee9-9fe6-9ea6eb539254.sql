
-- Bug 6: Change default statut to 'en_attente'
ALTER TABLE public.reservations ALTER COLUMN statut SET DEFAULT 'en_attente';

-- Bug 1: Update trigger handle_reservation_property_status
CREATE OR REPLACE FUNCTION public.handle_reservation_property_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.property_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.statut IN ('en_attente', 'en_cours') THEN
    UPDATE public.properties SET statut = 'reserve', updated_at = now() WHERE id = NEW.property_id;
  ELSIF NEW.statut IN ('terminee', 'annulee') THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.reservations
      WHERE property_id = NEW.property_id
        AND id != NEW.id
        AND statut IN ('en_attente', 'en_cours')
    ) THEN
      UPDATE public.properties SET statut = 'disponible', updated_at = now() WHERE id = NEW.property_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- Bug 2: Update auto_complete_reservations to check en_attente too
CREATE OR REPLACE FUNCTION public.auto_complete_reservations(_entreprise_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

      IF _res.property_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.reservations
        WHERE property_id = _res.property_id
          AND id != _res.id
          AND statut IN ('en_attente', 'en_cours')
      ) THEN
        UPDATE public.properties SET statut = 'disponible', updated_at = now()
        WHERE id = _res.property_id;
      END IF;
    END IF;
  END LOOP;
END;
$function$;

-- Bug 5: Update v_dashboard_simple view to use en_attente instead of confirmee
CREATE OR REPLACE VIEW public.v_dashboard_simple WITH (security_invoker = true) AS
SELECT e.id AS entreprise_id,
    COALESCE(r.revenus_mois, 0::numeric) AS revenus_mois,
    COALESCE(d.depenses_mois, 0::numeric) AS depenses_mois,
    COALESCE(r.revenus_mois, 0::numeric) - COALESCE(d.depenses_mois, 0::numeric) AS benefice_estime,
    COALESCE(f.factures_impayees, 0::bigint) AS factures_impayees,
    COALESCE(arr.arrivees_aujourdhui, 0::bigint) AS arrivees_aujourdhui,
    COALESCE(dep.departs_aujourdhui, 0::bigint) AS departs_aujourdhui,
    COALESCE(t.taches_urgentes, 0::bigint) AS taches_urgentes,
    COALESCE(pa.paiements_attendus, 0::numeric) AS paiements_attendus,
    COALESCE(sc.sejours_en_cours, 0::bigint) AS sejours_en_cours
   FROM entreprises e
     LEFT JOIN LATERAL ( SELECT sum(rev.montant) AS revenus_mois
           FROM revenus rev
          WHERE rev.entreprise_id = e.id AND rev.date >= date_trunc('month', CURRENT_DATE::timestamp with time zone)) r ON true
     LEFT JOIN LATERAL ( SELECT sum(dep_1.montant) AS depenses_mois
           FROM depenses dep_1
          WHERE dep_1.entreprise_id = e.id AND dep_1.date >= date_trunc('month', CURRENT_DATE::timestamp with time zone)) d ON true
     LEFT JOIN LATERAL ( SELECT count(*) AS factures_impayees
           FROM factures fac
          WHERE fac.entreprise_id = e.id AND fac.statut = 'non_paye'::facture_statut) f ON true
     LEFT JOIN LATERAL ( SELECT count(*) AS arrivees_aujourdhui
           FROM reservations res
          WHERE res.entreprise_id = e.id AND res.date_arrivee = CURRENT_DATE AND res.statut IN ('en_attente', 'en_cours')) arr ON true
     LEFT JOIN LATERAL ( SELECT count(*) AS departs_aujourdhui
           FROM reservations res
          WHERE res.entreprise_id = e.id AND res.date_depart = CURRENT_DATE AND res.statut IN ('en_attente', 'en_cours')) dep ON true
     LEFT JOIN LATERAL ( SELECT count(*) AS taches_urgentes
           FROM taches ta
          WHERE ta.entreprise_id = e.id AND ta.statut = 'a_faire'::tache_statut AND ta.date <= CURRENT_DATE) t ON true
     LEFT JOIN LATERAL ( SELECT COALESCE(sum(res.montant_total - res.montant_paye), 0::numeric) AS paiements_attendus
           FROM reservations res
          WHERE res.entreprise_id = e.id AND res.statut IN ('en_attente', 'en_cours') AND res.montant_paye < res.montant_total) pa ON true
     LEFT JOIN LATERAL ( SELECT count(*) AS sejours_en_cours
           FROM reservations res
          WHERE res.entreprise_id = e.id AND res.statut IN ('en_cours', 'en_attente') AND res.date_arrivee <= CURRENT_DATE AND res.date_depart >= CURRENT_DATE) sc ON true;
