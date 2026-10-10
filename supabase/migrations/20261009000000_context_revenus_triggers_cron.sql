-- Optimum Immo — rattrapage base de données (get_current_user_context, revenus, triggers factures, cron)
-- Appliqué sur le projet bzfmlawgxewfplzmivmg le 2026-10-09. Idempotent.

-- 1) Fonction de contexte utilisateur utilisée par le Dashboard
CREATE OR REPLACE FUNCTION public.get_current_user_context()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _result jsonb;
BEGIN
  IF _user_id IS NULL THEN
    RETURN jsonb_build_object('user_id', NULL, 'nom', NULL, 'email', NULL, 'entreprise_id', NULL, 'role', NULL);
  END IF;

  SELECT jsonb_build_object(
    'user_id', p.id,
    'nom', p.nom,
    'email', p.email,
    'entreprise_id', p.entreprise_id,
    'role', ur.role
  )
  INTO _result
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON ur.user_id = p.id
  WHERE p.id = _user_id
  LIMIT 1;

  RETURN COALESCE(
    _result,
    jsonb_build_object('user_id', _user_id, 'nom', NULL, 'email', NULL, 'entreprise_id', NULL, 'role', NULL)
  );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.get_current_user_context() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_current_user_context() TO authenticated, service_role;

-- 2) Colonnes manquantes sur revenus (utilisées par le frontend)
ALTER TABLE public.revenus
  ADD COLUMN IF NOT EXISTS source_type text NOT NULL DEFAULT 'manuel',
  ADD COLUMN IF NOT EXISTS reservation_id uuid NULL,
  ADD COLUMN IF NOT EXISTS source text NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'revenus_reservation_id_fkey' AND conrelid = 'public.revenus'::regclass) THEN
    ALTER TABLE public.revenus
      ADD CONSTRAINT revenus_reservation_id_fkey
      FOREIGN KEY (reservation_id) REFERENCES public.reservations(id) ON DELETE SET NULL;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_revenus_reservation_id ON public.revenus (reservation_id);

UPDATE public.revenus SET source_type = CASE WHEN facture_id IS NOT NULL THEN 'facture' ELSE 'manuel' END
WHERE source_type IS DISTINCT FROM CASE WHEN facture_id IS NOT NULL THEN 'facture' ELSE 'manuel' END;

-- 3) Facture payée -> revenu + réservation soldée (remplace les 2 anciens triggers)
CREATE OR REPLACE FUNCTION public.handle_facture_paid_global()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.statut = 'paye' AND (OLD.statut IS NULL OR OLD.statut != 'paye') THEN
    IF NOT EXISTS (SELECT 1 FROM public.revenus WHERE facture_id = NEW.id) THEN
      INSERT INTO public.revenus (facture_id, entreprise_id, montant, date, source_type, reservation_id)
      VALUES (NEW.id, NEW.entreprise_id, NEW.montant, CURRENT_DATE, 'facture', NEW.reservation_id);
    END IF;
    IF NEW.reservation_id IS NOT NULL THEN
      UPDATE public.reservations SET montant_paye = montant_total, updated_at = now()
      WHERE id = NEW.reservation_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.handle_facture_paid_global() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_facture_paid ON public.factures;
DROP TRIGGER IF EXISTS on_facture_paid_sync_reservation ON public.factures;
DROP TRIGGER IF EXISTS on_facture_paid_global ON public.factures;
CREATE TRIGGER on_facture_paid_global AFTER UPDATE ON public.factures
FOR EACH ROW EXECUTE FUNCTION public.handle_facture_paid_global();

-- 4) Suppression d'une facture -> suppression de ses revenus ; suppression réservée aux admins
CREATE OR REPLACE FUNCTION public.handle_facture_deleted()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.revenus WHERE facture_id = OLD.id;
  RETURN OLD;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.handle_facture_deleted() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS on_facture_deleted ON public.factures;
CREATE TRIGGER on_facture_deleted BEFORE DELETE ON public.factures
FOR EACH ROW EXECUTE FUNCTION public.handle_facture_deleted();

DROP POLICY IF EXISTS "Role-based factures delete" ON public.factures;
DROP POLICY IF EXISTS "Admin-only factures delete" ON public.factures;
CREATE POLICY "Admin-only factures delete" ON public.factures FOR DELETE TO authenticated
USING (entreprise_id = get_user_entreprise_id((select auth.uid())) AND has_role((select auth.uid()), 'admin'::app_role));

-- 5) Tâches automatiques (réservations terminées, départs du jour)
CREATE OR REPLACE FUNCTION public.auto_complete_reservations_all()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _ent RECORD;
BEGIN
  FOR _ent IN SELECT id FROM public.entreprises LOOP
    PERFORM public.auto_complete_reservations(_ent.id);
  END LOOP;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.auto_complete_reservations_all() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.notify_departures_today()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  _res RECORD; _user RECORD; _client_nom TEXT; _client_tel TEXT; _msg TEXT;
BEGIN
  FOR _res IN
    SELECT r.id, r.entreprise_id, r.client_id, r.property_name, r.date_depart
    FROM public.reservations r
    WHERE r.date_depart = CURRENT_DATE AND r.statut IN ('en_cours', 'confirmee', 'en_attente')
  LOOP
    SELECT c.nom, c.telephone INTO _client_nom, _client_tel FROM public.clients c WHERE c.id = _res.client_id;
    _msg := 'Départ prévu : ' || COALESCE(_client_nom, 'Client inconnu')
         || ' - ' || COALESCE(_res.property_name, 'Bien')
         || CASE WHEN _client_tel IS NOT NULL THEN ' | Contact: ' || _client_tel ELSE '' END;
    FOR _user IN
      SELECT p.id AS user_id FROM public.profiles p
      JOIN public.user_roles ur ON ur.user_id = p.id
      WHERE p.entreprise_id = _res.entreprise_id AND ur.role IN ('admin', 'agent')
    LOOP
      IF NOT EXISTS (
        SELECT 1 FROM public.notifications
        WHERE user_id = _user.user_id AND type = 'depart_jour' AND reference_id = _res.id AND created_at::date = CURRENT_DATE
      ) THEN
        INSERT INTO public.notifications (user_id, type, titre, message, reference_id)
        VALUES (_user.user_id, 'depart_jour', '🏠 Départ client aujourd''hui', _msg, _res.id);
      END IF;
    END LOOP;
  END LOOP;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.notify_departures_today() FROM PUBLIC, anon, authenticated;

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
DO $$
BEGIN
  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname IN ('auto-complete-reservations-hourly','notify-departures-daily');
  PERFORM cron.schedule('auto-complete-reservations-hourly', '0 * * * *', 'SELECT public.auto_complete_reservations_all();');
  PERFORM cron.schedule('notify-departures-daily', '30 8 * * *', 'SELECT public.notify_departures_today();');
END $$;

-- NB : subscription_daily_maintenance (expiration des essais) n'est volontairement PAS planifiée
-- tant qu'aucun système de paiement n'est actif.
