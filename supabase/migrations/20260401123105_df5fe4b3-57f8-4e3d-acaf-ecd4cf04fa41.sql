ALTER TABLE public.revenus
  ADD COLUMN IF NOT EXISTS source_type text NOT NULL DEFAULT 'manuel',
  ADD COLUMN IF NOT EXISTS reservation_id uuid NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'revenus_reservation_id_fkey'
      AND conrelid = 'public.revenus'::regclass
  ) THEN
    ALTER TABLE public.revenus
      ADD CONSTRAINT revenus_reservation_id_fkey
      FOREIGN KEY (reservation_id)
      REFERENCES public.reservations(id)
      ON DELETE SET NULL;
  END IF;
END
$$;

UPDATE public.revenus
SET source_type = CASE
  WHEN facture_id IS NOT NULL THEN 'facture'
  ELSE 'manuel'
END
WHERE source_type IS DISTINCT FROM CASE
  WHEN facture_id IS NOT NULL THEN 'facture'
  ELSE 'manuel'
END;

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
      VALUES (NEW.id, NEW.entreprise_id, NEW.montant, NEW.date, 'facture', NEW.reservation_id);
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

DROP TRIGGER IF EXISTS on_facture_paid ON public.factures;
DROP TRIGGER IF EXISTS on_facture_paid_sync_reservation ON public.factures;
DROP TRIGGER IF EXISTS on_facture_paid_global ON public.factures;

CREATE TRIGGER on_facture_paid_global
AFTER UPDATE ON public.factures
FOR EACH ROW
EXECUTE FUNCTION public.handle_facture_paid_global();

CREATE OR REPLACE FUNCTION public.auto_complete_reservations(_entreprise_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _res RECORD;
BEGIN
  FOR _res IN
    SELECT id, property_id
    FROM public.reservations
    WHERE entreprise_id = _entreprise_id
      AND statut = 'en_cours'
      AND date_depart < now()::date
  LOOP
    UPDATE public.reservations
    SET statut = 'terminee',
        updated_at = now()
    WHERE id = _res.id;

    IF _res.property_id IS NOT NULL
       AND NOT EXISTS (
         SELECT 1
         FROM public.reservations r
         WHERE r.property_id = _res.property_id
           AND r.id <> _res.id
           AND r.statut IN ('en_attente', 'en_cours')
       ) THEN
      UPDATE public.properties
      SET statut = 'disponible',
          updated_at = now()
      WHERE id = _res.property_id;
    END IF;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_complete_reservations_all()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _ent RECORD;
BEGIN
  FOR _ent IN
    SELECT id FROM public.entreprises
  LOOP
    PERFORM public.auto_complete_reservations(_ent.id);
  END LOOP;
END;
$$;

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

DO $$
DECLARE
  _job_id bigint;
BEGIN
  SELECT jobid
  INTO _job_id
  FROM cron.job
  WHERE jobname = 'auto-complete-reservations-hourly'
  LIMIT 1;

  IF _job_id IS NOT NULL THEN
    PERFORM cron.unschedule(_job_id);
  END IF;

  PERFORM cron.schedule(
    'auto-complete-reservations-hourly',
    '0 * * * *',
    'SELECT public.auto_complete_reservations_all();'
  );
END;
$$;