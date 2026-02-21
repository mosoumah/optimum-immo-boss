
-- 1. Table subscriptions
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise_id uuid NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'standard',
  status text NOT NULL DEFAULT 'active',
  start_date timestamptz DEFAULT now(),
  end_date timestamptz,
  payment_reference text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(entreprise_id)
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage subscriptions"
  ON public.subscriptions FOR ALL
  USING (entreprise_id = get_user_entreprise_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (entreprise_id = get_user_entreprise_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their subscription"
  ON public.subscriptions FOR SELECT
  USING (entreprise_id = get_user_entreprise_id(auth.uid()));

-- 2. Vue Mode Simple
CREATE OR REPLACE VIEW public.v_dashboard_simple AS
SELECT
  e.id AS entreprise_id,
  COALESCE(r.total_revenus, 0) AS revenus_mois,
  COALESCE(d.total_depenses, 0) AS depenses_mois,
  COALESCE(r.total_revenus, 0) - COALESCE(d.total_depenses, 0) AS benefice_estime,
  COALESCE(f.factures_impayees, 0) AS factures_impayees,
  COALESCE(res_arr.arrivees, 0) AS arrivees_aujourdhui,
  COALESCE(res_dep.departs, 0) AS departs_aujourdhui,
  COALESCE(t.taches_urgentes, 0) AS taches_urgentes,
  COALESCE(f.montant_impaye, 0) AS paiements_attendus
FROM entreprises e
LEFT JOIN LATERAL (
  SELECT SUM(montant) AS total_revenus FROM revenus
  WHERE entreprise_id = e.id AND date >= date_trunc('month', CURRENT_DATE)
) r ON true
LEFT JOIN LATERAL (
  SELECT SUM(montant) AS total_depenses FROM depenses
  WHERE entreprise_id = e.id AND date >= date_trunc('month', CURRENT_DATE)
) d ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS factures_impayees, SUM(montant) AS montant_impaye FROM factures
  WHERE entreprise_id = e.id AND statut = 'non_paye'
) f ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS arrivees FROM reservations
  WHERE entreprise_id = e.id AND date_arrivee = CURRENT_DATE AND statut = 'confirmee'
) res_arr ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS departs FROM reservations
  WHERE entreprise_id = e.id AND date_depart = CURRENT_DATE
) res_dep ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS taches_urgentes FROM taches
  WHERE entreprise_id = e.id AND date = CURRENT_DATE AND statut = 'a_faire'
) t ON true;

-- 3. Vue Mode Avancé Finance
CREATE OR REPLACE VIEW public.v_dashboard_advanced_finance AS
SELECT
  e.id AS entreprise_id,
  COALESCE(cs.revenus_court_sejour, 0) AS revenus_court_sejour,
  COALESCE(ms.revenus_mensuel, 0) AS revenus_mensuel,
  COALESCE(vt.revenus_vente, 0) AS revenus_vente,
  COALESCE(dep.total_depenses, 0) AS depenses_totales,
  COALESCE(cs.revenus_court_sejour, 0) + COALESCE(ms.revenus_mensuel, 0) 
    + COALESCE(vt.revenus_vente, 0) - COALESCE(dep.total_depenses, 0) AS benefice_net,
  COALESCE(lr.loyers_retard, 0) AS loyers_en_retard
FROM entreprises e
LEFT JOIN LATERAL (
  SELECT SUM(rev.montant) AS revenus_court_sejour FROM revenus rev
  JOIN factures fac ON fac.id = rev.facture_id
  JOIN reservations res ON res.client_id = fac.client_id AND res.entreprise_id = fac.entreprise_id
  WHERE rev.entreprise_id = e.id AND rev.date >= date_trunc('month', CURRENT_DATE)
    AND res.type_location = 'court_sejour'
) cs ON true
LEFT JOIN LATERAL (
  SELECT SUM(rev.montant) AS revenus_mensuel FROM revenus rev
  JOIN factures fac ON fac.id = rev.facture_id
  JOIN reservations res ON res.client_id = fac.client_id AND res.entreprise_id = fac.entreprise_id
  WHERE rev.entreprise_id = e.id AND rev.date >= date_trunc('month', CURRENT_DATE)
    AND res.type_location = 'mensuel'
) ms ON true
LEFT JOIN LATERAL (
  SELECT SUM(montant_vente) AS revenus_vente FROM sales_transactions
  WHERE entreprise_id = e.id AND date_vente >= date_trunc('month', CURRENT_DATE)
) vt ON true
LEFT JOIN LATERAL (
  SELECT SUM(montant) AS total_depenses FROM depenses
  WHERE entreprise_id = e.id AND date >= date_trunc('month', CURRENT_DATE)
) dep ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS loyers_retard FROM reservations
  WHERE entreprise_id = e.id AND montant_paye < montant_total AND statut != 'annulee'
) lr ON true;

-- 4. Vue Mode Avancé Property
CREATE OR REPLACE VIEW public.v_dashboard_advanced_property AS
SELECT
  e.id AS entreprise_id,
  COALESCE(p_total.total, 0) AS biens_total,
  COALESCE(p_dispo.disponibles, 0) AS biens_disponibles,
  COALESCE(p_occ.occupes, 0) AS biens_occupes,
  CASE WHEN COALESCE(p_total.total, 0) > 0
    THEN ROUND(COALESCE(p_occ.occupes, 0)::numeric / p_total.total * 100, 1)
    ELSE 0 END AS taux_occupation,
  COALESCE(res_cours.en_cours, 0) AS reservations_en_cours
FROM entreprises e
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS total FROM properties WHERE entreprise_id = e.id AND statut != 'archive'
) p_total ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS disponibles FROM properties WHERE entreprise_id = e.id AND statut = 'disponible'
) p_dispo ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS occupes FROM properties WHERE entreprise_id = e.id AND statut = 'occupe'
) p_occ ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS en_cours FROM reservations
  WHERE entreprise_id = e.id AND date_arrivee <= CURRENT_DATE AND date_depart >= CURRENT_DATE AND statut = 'confirmee'
) res_cours ON true;

-- 5. Fonction Top 3 biens
CREATE OR REPLACE FUNCTION public.get_top_properties(_entreprise_id uuid)
RETURNS TABLE(property_name text, total_revenue numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT res.property_name, SUM(res.montant_total) AS total_revenue
  FROM reservations res
  WHERE res.entreprise_id = _entreprise_id
    AND res.date_arrivee >= date_trunc('month', CURRENT_DATE)
  GROUP BY res.property_name
  ORDER BY total_revenue DESC
  LIMIT 3;
$$;

-- 6. Vue Alertes
CREATE OR REPLACE VIEW public.v_dashboard_alerts AS
SELECT
  r.entreprise_id,
  r.id,
  'depart_imminent' AS alert_type,
  r.property_name AS label,
  r.date_depart::text AS detail
FROM reservations r
WHERE r.date_depart BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '3 days'
  AND r.statut = 'confirmee'
UNION ALL
SELECT
  f.entreprise_id,
  f.id,
  'paiement_retard' AS alert_type,
  f.description AS label,
  f.montant::text AS detail
FROM factures f
WHERE f.statut = 'non_paye' AND f.date < CURRENT_DATE - INTERVAL '7 days'
UNION ALL
SELECT
  r2.entreprise_id,
  r2.id,
  'bien_bientot_disponible' AS alert_type,
  r2.property_name AS label,
  r2.date_depart::text AS detail
FROM reservations r2
WHERE r2.date_depart BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
  AND r2.statut = 'confirmee';
