
-- Update auto_complete_reservations to use reservation_id first, fallback to description pattern
CREATE OR REPLACE FUNCTION public.auto_complete_reservations(_entreprise_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _res RECORD;
  _facture_payee BOOLEAN;
BEGIN
  FOR _res IN
    SELECT id, client_id, entreprise_id, property_name, property_id
    FROM public.reservations
    WHERE entreprise_id = _entreprise_id
      AND statut IN ('en_cours', 'confirmee')
      AND date_depart < CURRENT_DATE
  LOOP
    -- Check by reservation_id first, then fallback to description pattern
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
$$;
