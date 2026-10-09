
-- 1. Extend subscriptions table
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS billing_cycle text DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 2. Trigger: auto-provision 14-day trial on new entreprise
CREATE OR REPLACE FUNCTION public.provision_trial_on_entreprise()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.subscriptions (entreprise_id, plan, status, start_date, end_date, trial_ends_at, billing_cycle)
  VALUES (NEW.id, 'trial', 'trial', now(), now() + interval '14 days', now() + interval '14 days', 'monthly')
  ON CONFLICT (entreprise_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_entreprise_created_provision_trial ON public.entreprises;
CREATE TRIGGER on_entreprise_created_provision_trial
AFTER INSERT ON public.entreprises
FOR EACH ROW EXECUTE FUNCTION public.provision_trial_on_entreprise();

-- 3. Backfill: create trial for existing entreprises without a subscription
INSERT INTO public.subscriptions (entreprise_id, plan, status, start_date, end_date, trial_ends_at, billing_cycle)
SELECT e.id, 'trial', 'trial', now(), now() + interval '14 days', now() + interval '14 days', 'monthly'
FROM public.entreprises e
WHERE NOT EXISTS (SELECT 1 FROM public.subscriptions s WHERE s.entreprise_id = e.id);

-- 4. Function: get subscription state
CREATE OR REPLACE FUNCTION public.get_subscription_state(_entreprise_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _sub RECORD;
  _now timestamptz := now();
  _days_left integer;
  _is_trial boolean;
  _is_active boolean;
  _is_expired boolean;
BEGIN
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
    'plan', _sub.plan,
    'status', _sub.status,
    'billing_cycle', COALESCE(_sub.billing_cycle, 'monthly'),
    'is_trial', _is_trial,
    'days_left', _days_left,
    'is_active', _is_active,
    'is_expired', _is_expired,
    'trial_ends_at', _sub.trial_ends_at,
    'end_date', _sub.end_date,
    'start_date', _sub.start_date
  );
END;
$$;

-- 5. Function: daily subscription maintenance (expire + notify)
CREATE OR REPLACE FUNCTION public.subscription_daily_maintenance()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _sub RECORD;
  _admin RECORD;
  _days_left integer;
  _titre text;
  _message text;
  _type text;
  _notif_key text;
BEGIN
  -- Mark expired subscriptions
  UPDATE public.subscriptions
  SET status = 'expired', updated_at = now()
  WHERE status IN ('trial','active')
    AND end_date IS NOT NULL
    AND end_date <= now();

  -- Send reminder notifications for trials
  FOR _sub IN
    SELECT s.*, e.id AS ent_id
    FROM public.subscriptions s
    JOIN public.entreprises e ON e.id = s.entreprise_id
    WHERE s.status IN ('trial','expired')
  LOOP
    IF _sub.status = 'expired' THEN
      _type := 'trial_expired';
      _titre := '⛔ Votre essai est terminé';
      _message := 'Choisissez un forfait pour continuer à utiliser Optimum Immo.';
      _notif_key := 'expired';
    ELSE
      _days_left := GREATEST(0, CEIL(EXTRACT(EPOCH FROM (_sub.trial_ends_at - now())) / 86400)::int);
      IF _days_left = 7 THEN
        _type := 'trial_reminder_7'; _titre := '🎁 Essai : 7 jours restants';
        _message := 'Il vous reste 7 jours d''essai gratuit. Découvrez nos forfaits.';
        _notif_key := 'j-7';
      ELSIF _days_left = 3 THEN
        _type := 'trial_reminder_3'; _titre := '⏳ Essai : 3 jours restants';
        _message := 'Plus que 3 jours d''essai. Choisissez votre forfait dès maintenant.';
        _notif_key := 'j-3';
      ELSIF _days_left = 1 THEN
        _type := 'trial_reminder_1'; _titre := '⚠️ Essai : 1 jour restant';
        _message := 'Votre essai se termine demain. Sélectionnez un abonnement.';
        _notif_key := 'j-1';
      ELSIF _days_left = 0 THEN
        _type := 'trial_reminder_0'; _titre := '🚨 Essai : dernier jour';
        _message := 'Votre essai se termine aujourd''hui.';
        _notif_key := 'j-0';
      ELSE
        CONTINUE;
      END IF;
    END IF;

    FOR _admin IN
      SELECT p.id AS user_id
      FROM public.profiles p
      JOIN public.user_roles ur ON ur.user_id = p.id
      WHERE p.entreprise_id = _sub.ent_id AND ur.role = 'admin'
    LOOP
      IF NOT EXISTS (
        SELECT 1 FROM public.notifications
        WHERE user_id = _admin.user_id
          AND type = _type
          AND reference_id = _sub.ent_id
          AND created_at::date = CURRENT_DATE
      ) THEN
        INSERT INTO public.notifications (user_id, type, titre, message, reference_id)
        VALUES (_admin.user_id, _type, _titre, _message, _sub.ent_id);
      END IF;
    END LOOP;
  END LOOP;
END;
$$;

-- 6. Grant execute on functions
GRANT EXECUTE ON FUNCTION public.get_subscription_state(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.subscription_daily_maintenance() TO service_role;
