
-- Function to notify admins/agents about departures today
CREATE OR REPLACE FUNCTION public.notify_departures_today()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _res RECORD;
  _user RECORD;
  _client_nom TEXT;
  _client_tel TEXT;
  _msg TEXT;
BEGIN
  -- Loop through reservations departing today
  FOR _res IN
    SELECT r.id, r.entreprise_id, r.client_id, r.property_name, r.date_depart
    FROM public.reservations r
    WHERE r.date_depart = CURRENT_DATE
      AND r.statut IN ('en_cours', 'confirmee', 'en_attente')
  LOOP
    -- Get client info
    SELECT c.nom, c.telephone INTO _client_nom, _client_tel
    FROM public.clients c
    WHERE c.id = _res.client_id;

    _msg := 'Départ prévu : ' || COALESCE(_client_nom, 'Client inconnu')
         || ' - ' || COALESCE(_res.property_name, 'Bien')
         || CASE WHEN _client_tel IS NOT NULL THEN ' | Contact: ' || _client_tel ELSE '' END;

    -- Notify each admin/agent in the entreprise
    FOR _user IN
      SELECT p.id AS user_id
      FROM public.profiles p
      JOIN public.user_roles ur ON ur.user_id = p.id
      WHERE p.entreprise_id = _res.entreprise_id
        AND ur.role IN ('admin', 'agent')
    LOOP
      -- Anti-duplicate: skip if already notified today for this reservation
      IF NOT EXISTS (
        SELECT 1 FROM public.notifications
        WHERE user_id = _user.user_id
          AND type = 'depart_jour'
          AND reference_id = _res.id
          AND created_at::date = CURRENT_DATE
      ) THEN
        INSERT INTO public.notifications (user_id, type, titre, message, reference_id)
        VALUES (
          _user.user_id,
          'depart_jour',
          '🏠 Départ client aujourd''hui',
          _msg,
          _res.id
        );
      END IF;
    END LOOP;
  END LOOP;
END;
$$;

-- Schedule cron job at 8:30 UTC daily
SELECT cron.schedule(
  'notify-departures-daily',
  '30 8 * * *',
  'SELECT public.notify_departures_today()'
);
