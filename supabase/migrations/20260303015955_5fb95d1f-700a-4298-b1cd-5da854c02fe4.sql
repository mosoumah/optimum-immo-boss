
CREATE OR REPLACE FUNCTION public.auto_complete_reservations(_entreprise_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _res RECORD;
BEGIN
  -- Find all reservations that are "en_cours" with departure date passed
  FOR _res IN
    SELECT id, client_id, entreprise_id, property_name, montant_total
    FROM public.reservations
    WHERE entreprise_id = _entreprise_id
      AND statut = 'en_cours'
      AND date_depart < CURRENT_DATE
  LOOP
    -- Mark reservation as terminated
    UPDATE public.reservations
    SET statut = 'terminee', updated_at = now()
    WHERE id = _res.id;

    -- Mark linked unpaid invoices as paid (triggers handle_facture_paid -> creates revenue)
    UPDATE public.factures
    SET statut = 'paye', updated_at = now()
    WHERE client_id = _res.client_id
      AND entreprise_id = _res.entreprise_id
      AND statut = 'non_paye'
      AND description ILIKE '%' || _res.property_name || '%';
  END LOOP;
END;
$$;
