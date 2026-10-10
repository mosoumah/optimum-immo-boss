-- Optimum Immo — durcissement sécurité & performance (consolidé le 2026-10-08)
-- À placer dans supabase/migrations/ puis appliquer sur le projet Supabase utilisé par l'app.

-- =====================================================================
-- 1) Fonctions internes (triggers / cron) : plus appelables via l'API
-- =====================================================================
REVOKE EXECUTE ON FUNCTION public.handle_facture_paid() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_signup() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_property_media_cover() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_reservation_payment_sync() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_reservation_property_status() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_tache_assigned() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_tache_message_notification() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.provision_trial_on_entreprise() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.subscription_daily_maintenance() FROM PUBLIC, anon, authenticated;

-- =====================================================================
-- 2) Fonctions utilisées par l'app / les policies : connectés uniquement
-- =====================================================================
REVOKE EXECUTE ON FUNCTION public.admin_create_user_in_entreprise(uuid, uuid, app_role, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.auto_complete_reservations(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.bootstrap_current_user() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_access_tache_messages(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_subscription_state(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_top_properties(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_client_id(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_entreprise_id(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_permissions(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_permission(uuid, app_permission) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.admin_create_user_in_entreprise(uuid, uuid, app_role, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.auto_complete_reservations(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.bootstrap_current_user() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_access_tache_messages(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_subscription_state(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_top_properties(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_client_id(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_entreprise_id(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_permissions(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, app_permission) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;

-- =====================================================================
-- 3) Isolation multi-entreprise dans les RPC
-- =====================================================================
CREATE OR REPLACE FUNCTION public.auto_complete_reservations(_entreprise_id uuid)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  _res RECORD;
  _facture_payee BOOLEAN;
BEGIN
  IF auth.uid() IS NOT NULL AND _entreprise_id IS DISTINCT FROM public.get_user_entreprise_id(auth.uid()) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;

  FOR _res IN
    SELECT id, client_id, entreprise_id, property_name, property_id, montant_total
    FROM public.reservations
    WHERE entreprise_id = _entreprise_id
      AND statut IN ('en_attente', 'en_cours', 'confirmee')
      AND date_depart < CURRENT_DATE
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM public.factures
      WHERE statut = 'paye'
        AND (
          reservation_id = _res.id
          OR (
            reservation_id IS NULL
            AND client_id = _res.client_id
            AND entreprise_id = _res.entreprise_id
            AND description ILIKE '%' || _res.property_name || '%'
          )
        )
    ) INTO _facture_payee;

    IF _facture_payee THEN
      UPDATE public.reservations
      SET statut = 'terminee', montant_paye = montant_total, updated_at = now()
      WHERE id = _res.id;
    ELSE
      UPDATE public.reservations
      SET statut = 'terminee', updated_at = now()
      WHERE id = _res.id;
    END IF;

    IF _res.property_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.reservations
      WHERE property_id = _res.property_id
        AND id != _res.id
        AND statut IN ('en_attente', 'en_cours')
    ) THEN
      UPDATE public.properties SET statut = 'disponible', updated_at = now()
      WHERE id = _res.property_id;
    END IF;
  END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_top_properties(_entreprise_id uuid)
 RETURNS TABLE(property_name text, total_revenue numeric)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NOT NULL AND _entreprise_id IS DISTINCT FROM public.get_user_entreprise_id(auth.uid()) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;
  RETURN QUERY
  SELECT res.property_name, SUM(res.montant_total) AS total_revenue
  FROM public.reservations res
  WHERE res.entreprise_id = _entreprise_id
    AND res.date_arrivee >= date_trunc('month', CURRENT_DATE)
  GROUP BY res.property_name
  ORDER BY total_revenue DESC
  LIMIT 3;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_subscription_state(_entreprise_id uuid)
 RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  _sub RECORD;
  _now timestamptz := now();
  _days_left integer;
  _is_trial boolean;
  _is_active boolean;
  _is_expired boolean;
BEGIN
  IF auth.uid() IS NOT NULL AND _entreprise_id IS DISTINCT FROM public.get_user_entreprise_id(auth.uid()) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;
  SELECT * INTO _sub FROM public.subscriptions WHERE entreprise_id = _entreprise_id LIMIT 1;
  IF _sub IS NULL THEN
    RETURN jsonb_build_object(
      'plan', 'trial', 'status', 'trial', 'billing_cycle', 'monthly',
      'is_trial', true, 'days_left', 14, 'is_active', true, 'is_expired', false,
      'trial_ends_at', null, 'end_date', null
    );
  END IF;
  _is_trial := _sub.status = 'trial' AND (_sub.trial_ends_at IS NULL OR _sub.trial_ends_at > _now);
  _is_expired := (_sub.status = 'expired') OR (_sub.end_date IS NOT NULL AND _sub.end_date <= _now AND _sub.status IN ('trial','active'));
  _is_active := NOT _is_expired AND _sub.status IN ('trial','active','pending_payment');
  IF _sub.trial_ends_at IS NOT NULL THEN
    _days_left := GREATEST(0, CEIL(EXTRACT(EPOCH FROM (_sub.trial_ends_at - _now)) / 86400)::int);
  ELSIF _sub.end_date IS NOT NULL THEN
    _days_left := GREATEST(0, CEIL(EXTRACT(EPOCH FROM (_sub.end_date - _now)) / 86400)::int);
  ELSE
    _days_left := 0;
  END IF;
  RETURN jsonb_build_object(
    'plan', _sub.plan, 'status', _sub.status, 'billing_cycle', COALESCE(_sub.billing_cycle, 'monthly'),
    'is_trial', _is_trial, 'days_left', _days_left, 'is_active', _is_active, 'is_expired', _is_expired,
    'trial_ends_at', _sub.trial_ends_at, 'end_date', _sub.end_date, 'start_date', _sub.start_date
  );
END;
$function$;

-- =====================================================================
-- 4) Plus aucune table / vue exposée au rôle anonyme
-- =====================================================================
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM anon;

-- =====================================================================
-- 5) Fonctions d'identité : limitées à soi-même ou à sa propre entreprise
-- =====================================================================
CREATE OR REPLACE FUNCTION public._can_inspect_user(_target uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT auth.uid() IS NULL
      OR _target = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.profiles t
        JOIN public.profiles c ON c.id = auth.uid()
        WHERE t.id = _target
          AND t.entreprise_id IS NOT NULL
          AND t.entreprise_id = c.entreprise_id
      )
$$;
REVOKE EXECUTE ON FUNCTION public._can_inspect_user(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._can_inspect_user(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.get_user_entreprise_id(_user_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT entreprise_id FROM public.profiles WHERE id = _user_id AND public._can_inspect_user(_user_id) $$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT role FROM public.user_roles WHERE user_id = _user_id AND public._can_inspect_user(_user_id) LIMIT 1 $$;

CREATE OR REPLACE FUNCTION public.get_user_client_id(_user_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT client_id FROM public.client_accounts WHERE user_id = _user_id AND public._can_inspect_user(_user_id) LIMIT 1 $$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT public._can_inspect_user(_user_id) AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission app_permission)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  user_role app_role;
  custom_permission BOOLEAN;
  role_has_permission BOOLEAN;
BEGIN
  IF NOT public._can_inspect_user(_user_id) THEN RETURN false; END IF;
  SELECT role INTO user_role FROM public.user_roles WHERE user_id = _user_id LIMIT 1;
  IF user_role IS NULL THEN RETURN false; END IF;
  SELECT granted INTO custom_permission FROM public.user_permissions
   WHERE user_id = _user_id AND permission = _permission;
  IF custom_permission IS NOT NULL THEN RETURN custom_permission; END IF;
  SELECT EXISTS(SELECT 1 FROM public.role_permissions WHERE role = user_role AND permission = _permission)
    INTO role_has_permission;
  RETURN role_has_permission;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_permissions(_user_id uuid)
RETURNS app_permission[] LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  user_role app_role;
  permissions app_permission[];
BEGIN
  IF NOT public._can_inspect_user(_user_id) THEN RETURN ARRAY[]::app_permission[]; END IF;
  SELECT role INTO user_role FROM public.user_roles WHERE user_id = _user_id LIMIT 1;
  IF user_role IS NULL THEN RETURN ARRAY[]::app_permission[]; END IF;
  SELECT ARRAY_AGG(DISTINCT perm) INTO permissions
  FROM (
    SELECT permission AS perm FROM public.role_permissions WHERE role = user_role
    UNION
    SELECT permission AS perm FROM public.user_permissions WHERE user_id = _user_id AND granted = true
    EXCEPT
    SELECT permission AS perm FROM public.user_permissions WHERE user_id = _user_id AND granted = false
  ) AS all_perms;
  RETURN COALESCE(permissions, ARRAY[]::app_permission[]);
END;
$function$;

-- =====================================================================
-- 6) Index sur les clés étrangères
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_ai_generated_images_entreprise_id ON public.ai_generated_images (entreprise_id);
CREATE INDEX IF NOT EXISTS idx_clients_assigned_to ON public.clients (assigned_to);
CREATE INDEX IF NOT EXISTS idx_clients_entreprise_id ON public.clients (entreprise_id);
CREATE INDEX IF NOT EXISTS idx_depenses_entreprise_id ON public.depenses (entreprise_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_entreprise_id ON public.direct_messages (entreprise_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_receiver_id ON public.direct_messages (receiver_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender_id ON public.direct_messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_factures_client_id ON public.factures (client_id);
CREATE INDEX IF NOT EXISTS idx_factures_created_by ON public.factures (created_by);
CREATE INDEX IF NOT EXISTS idx_factures_entreprise_id ON public.factures (entreprise_id);
CREATE INDEX IF NOT EXISTS idx_factures_reservation_id ON public.factures (reservation_id);
CREATE INDEX IF NOT EXISTS idx_profiles_entreprise_id ON public.profiles (entreprise_id);
CREATE INDEX IF NOT EXISTS idx_redesign_requests_entreprise_id ON public.redesign_requests (entreprise_id);
CREATE INDEX IF NOT EXISTS idx_reservations_client_id ON public.reservations (client_id);
CREATE INDEX IF NOT EXISTS idx_reservations_entreprise_id ON public.reservations (entreprise_id);
CREATE INDEX IF NOT EXISTS idx_revenus_entreprise_id ON public.revenus (entreprise_id);
CREATE INDEX IF NOT EXISTS idx_revenus_facture_id ON public.revenus (facture_id);
CREATE INDEX IF NOT EXISTS idx_tache_messages_tache_id ON public.tache_messages (tache_id);
CREATE INDEX IF NOT EXISTS idx_taches_assigned_to ON public.taches (assigned_to);
CREATE INDEX IF NOT EXISTS idx_taches_entreprise_id ON public.taches (entreprise_id);

-- =====================================================================
-- 7) Policies : suppression des doublons, tables sensibles en lecture seule
-- =====================================================================
DROP POLICY IF EXISTS "Admin can manage agency settings" ON public.agency_settings;
DROP POLICY IF EXISTS "Agent can read agency settings" ON public.agency_settings;
DROP POLICY IF EXISTS agency_settings_select ON public.agency_settings;
DROP POLICY IF EXISTS agency_settings_admin_insert ON public.agency_settings;
DROP POLICY IF EXISTS agency_settings_admin_update ON public.agency_settings;
DROP POLICY IF EXISTS agency_settings_admin_delete ON public.agency_settings;
CREATE POLICY agency_settings_select ON public.agency_settings FOR SELECT TO authenticated
  USING (entreprise_id = get_user_entreprise_id((select auth.uid()))
         AND (has_role((select auth.uid()), 'admin'::app_role) OR has_role((select auth.uid()), 'agent'::app_role)));
CREATE POLICY agency_settings_admin_insert ON public.agency_settings FOR INSERT TO authenticated
  WITH CHECK (entreprise_id = get_user_entreprise_id((select auth.uid())) AND has_role((select auth.uid()), 'admin'::app_role));
CREATE POLICY agency_settings_admin_update ON public.agency_settings FOR UPDATE TO authenticated
  USING (entreprise_id = get_user_entreprise_id((select auth.uid())) AND has_role((select auth.uid()), 'admin'::app_role))
  WITH CHECK (entreprise_id = get_user_entreprise_id((select auth.uid())) AND has_role((select auth.uid()), 'admin'::app_role));
CREATE POLICY agency_settings_admin_delete ON public.agency_settings FOR DELETE TO authenticated
  USING (entreprise_id = get_user_entreprise_id((select auth.uid())) AND has_role((select auth.uid()), 'admin'::app_role));

-- subscriptions : lecture seule côté client (écritures via service role / webhook de paiement)
DROP POLICY IF EXISTS "Admin can manage subscriptions" ON public.subscriptions;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.subscriptions FROM authenticated;

-- role_permissions : lecture seule côté client (table globale, gérée par migration)
DROP POLICY IF EXISTS "Admins can manage role permissions" ON public.role_permissions;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.role_permissions FROM authenticated;

-- user_permissions : un admin ne gère que les utilisateurs de sa propre entreprise
DROP POLICY IF EXISTS "Admins can manage user permissions" ON public.user_permissions;
DROP POLICY IF EXISTS "Users can read their own permissions" ON public.user_permissions;
DROP POLICY IF EXISTS user_permissions_select ON public.user_permissions;
DROP POLICY IF EXISTS user_permissions_admin_insert ON public.user_permissions;
DROP POLICY IF EXISTS user_permissions_admin_update ON public.user_permissions;
DROP POLICY IF EXISTS user_permissions_admin_delete ON public.user_permissions;
CREATE POLICY user_permissions_select ON public.user_permissions FOR SELECT TO authenticated
  USING (user_id = (select auth.uid())
         OR (has_role((select auth.uid()), 'admin'::app_role)
             AND get_user_entreprise_id(user_id) = get_user_entreprise_id((select auth.uid()))));
CREATE POLICY user_permissions_admin_insert ON public.user_permissions FOR INSERT TO authenticated
  WITH CHECK (has_role((select auth.uid()), 'admin'::app_role)
              AND get_user_entreprise_id(user_id) = get_user_entreprise_id((select auth.uid())));
CREATE POLICY user_permissions_admin_update ON public.user_permissions FOR UPDATE TO authenticated
  USING (has_role((select auth.uid()), 'admin'::app_role)
         AND get_user_entreprise_id(user_id) = get_user_entreprise_id((select auth.uid())))
  WITH CHECK (has_role((select auth.uid()), 'admin'::app_role)
              AND get_user_entreprise_id(user_id) = get_user_entreprise_id((select auth.uid())));
CREATE POLICY user_permissions_admin_delete ON public.user_permissions FOR DELETE TO authenticated
  USING (has_role((select auth.uid()), 'admin'::app_role)
         AND get_user_entreprise_id(user_id) = get_user_entreprise_id((select auth.uid())));

-- =====================================================================
-- 8) Toutes les policies : auth.uid() évalué une fois + rôle authenticated
-- =====================================================================
DO $$
DECLARE
  p record;
  new_qual text;
  new_check text;
  stmt text;
BEGIN
  FOR p IN SELECT * FROM pg_policies WHERE schemaname = 'public' LOOP
    new_qual  := regexp_replace(p.qual,       '(?<!SELECT )auth\.(uid|jwt|role)\(\)', '(select auth.\1())', 'g');
    new_check := regexp_replace(p.with_check, '(?<!SELECT )auth\.(uid|jwt|role)\(\)', '(select auth.\1())', 'g');
    stmt := format('ALTER POLICY %I ON %I.%I', p.policyname, p.schemaname, p.tablename);
    IF p.roles = '{public}' THEN
      stmt := stmt || ' TO authenticated';
    END IF;
    IF new_qual IS NOT NULL THEN
      stmt := stmt || format(' USING (%s)', new_qual);
    END IF;
    IF new_check IS NOT NULL THEN
      stmt := stmt || format(' WITH CHECK (%s)', new_check);
    END IF;
    EXECUTE stmt;
  END LOOP;
END $$;
