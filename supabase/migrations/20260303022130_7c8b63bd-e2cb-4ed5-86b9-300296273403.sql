
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
    SELECT id, client_id, entreprise_id, property_name
    FROM public.reservations
    WHERE entreprise_id = _entreprise_id
      AND statut = 'en_cours'
      AND date_depart < CURRENT_DATE
  LOOP
    -- Check if linked invoice is already paid
    SELECT EXISTS (
      SELECT 1 FROM public.factures
      WHERE client_id = _res.client_id
        AND entreprise_id = _res.entreprise_id
        AND statut = 'paye'
        AND description ILIKE '%' || _res.property_name || '%'
    ) INTO _facture_payee;

    -- Only mark as terminated if invoice is paid
    IF _facture_payee THEN
      UPDATE public.reservations
      SET statut = 'terminee', updated_at = now()
      WHERE id = _res.id;
    END IF;
  END LOOP;
END;
$$;
