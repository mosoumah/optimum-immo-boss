
CREATE OR REPLACE VIEW public.v_dashboard_simple WITH (security_invoker = true) AS
SELECT
  e.id AS entreprise_id,
  COALESCE(r.revenus_mois, 0) AS revenus_mois,
  COALESCE(d.depenses_mois, 0) AS depenses_mois,
  COALESCE(r.revenus_mois, 0) - COALESCE(d.depenses_mois, 0) AS benefice_estime,
  COALESCE(f.factures_impayees, 0) AS factures_impayees,
  COALESCE(arr.arrivees_aujourdhui, 0) AS arrivees_aujourdhui,
  COALESCE(dep.departs_aujourdhui, 0) AS departs_aujourdhui,
  COALESCE(t.taches_urgentes, 0) AS taches_urgentes,
  COALESCE(pa.paiements_attendus, 0) AS paiements_attendus,
  COALESCE(sc.sejours_en_cours, 0) AS sejours_en_cours
FROM entreprises e
LEFT JOIN LATERAL (
  SELECT SUM(rev.montant) AS revenus_mois FROM revenus rev
  WHERE rev.entreprise_id = e.id AND rev.date >= date_trunc('month', CURRENT_DATE)
) r ON true
LEFT JOIN LATERAL (
  SELECT SUM(dep.montant) AS depenses_mois FROM depenses dep
  WHERE dep.entreprise_id = e.id AND dep.date >= date_trunc('month', CURRENT_DATE)
) d ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS factures_impayees FROM factures fac
  WHERE fac.entreprise_id = e.id AND fac.statut = 'non_paye'
) f ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS arrivees_aujourdhui FROM reservations res
  WHERE res.entreprise_id = e.id AND res.date_arrivee = CURRENT_DATE
    AND res.statut IN ('confirmee', 'en_cours')
) arr ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS departs_aujourdhui FROM reservations res
  WHERE res.entreprise_id = e.id AND res.date_depart = CURRENT_DATE
    AND res.statut IN ('confirmee', 'en_cours')
) dep ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS taches_urgentes FROM taches ta
  WHERE ta.entreprise_id = e.id AND ta.statut = 'a_faire' AND ta.date <= CURRENT_DATE
) t ON true
LEFT JOIN LATERAL (
  SELECT COALESCE(SUM(res.montant_total - res.montant_paye), 0) AS paiements_attendus
  FROM reservations res
  WHERE res.entreprise_id = e.id AND res.statut IN ('confirmee', 'en_cours')
    AND res.montant_paye < res.montant_total
) pa ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS sejours_en_cours FROM reservations res
  WHERE res.entreprise_id = e.id AND res.statut IN ('en_cours', 'confirmee')
    AND res.date_arrivee <= CURRENT_DATE AND res.date_depart >= CURRENT_DATE
) sc ON true;
