

## Plan revise -- Restructuration du Dashboard Optimum Immo

Voici le plan mis a jour integrant vos 4 corrections.

---

### 1. Nouvelle table `subscriptions` (aucune modification de table existante)

```sql
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

-- Admin peut lire/gerer l'abonnement de son entreprise
CREATE POLICY "Admin can manage subscriptions"
  ON public.subscriptions FOR ALL
  USING (entreprise_id = get_user_entreprise_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (entreprise_id = get_user_entreprise_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));

-- Tous les membres peuvent lire l'abonnement de leur entreprise
CREATE POLICY "Users can view their subscription"
  ON public.subscriptions FOR SELECT
  USING (entreprise_id = get_user_entreprise_id(auth.uid()));
```

Cette structure permet :
- Gestion de l'expiration (champ `end_date`)
- Statuts flexibles : `active`, `expired`, `suspended`
- Reference de paiement pour Orange Money ou validation manuelle
- Integration future d'Orange Money sans changement de schema

---

### 2. Vues SQL optimisees (une requete par bloc)

Au lieu de 6-8 requetes paralleles cote frontend, les calculs complexes seront delegues a des vues SQL.

**Vue 1 -- Mode Simple : Resume financier + activite du jour**

```sql
CREATE OR REPLACE VIEW public.v_dashboard_simple AS
SELECT
  e.id AS entreprise_id,
  -- Ligne 1 : Finances
  COALESCE(r.total_revenus, 0) AS revenus_mois,
  COALESCE(d.total_depenses, 0) AS depenses_mois,
  COALESCE(r.total_revenus, 0) - COALESCE(d.total_depenses, 0) AS benefice_estime,
  COALESCE(f.factures_impayees, 0) AS factures_impayees,
  -- Ligne 2 : Activite du jour
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
```

**Vue 2 -- Mode Avance : Finances detaillees**

```sql
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
```

**Vue 3 -- Mode Avance : Indicateurs immobiliers**

```sql
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
```

**Fonction SQL pour Top 3 biens** (les vues ne supportent pas bien les sous-requetes ordonnees avec LIMIT) :

```sql
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
```

**Vue 4 -- Mode Avance : Alertes**

```sql
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
```

Toutes ces vues heritent automatiquement des RLS des tables sous-jacentes.

**Resultat** : Le frontend effectuera **une seule requete par section** au lieu de multiples appels.

---

### 3. FinancialChart.tsx -- Aucune modification

Le composant `FinancialChart.tsx` existant restera intact.

Un nouveau composant wrapper sera cree :

**`src/components/dashboard/AdvancedFinancialChartWrapper.tsx`**

Ce composant :
- Encapsule 3 instances separees avec des donnees filtrees par type (court sejour, mensuel, vente)
- Gere ses propres requetes de donnees
- Utilise les memes composants recharts que `FinancialChart` mais avec sa propre logique

---

### 4. Edge Function IA securisee

**`supabase/functions/dashboard-ai-summary/index.ts`**

Securisation complete :

```text
1. Verification JWT (getClaims)
   -> Rejet si pas de token valide

2. Recuperation entreprise_id via profil (cote backend, pas depuis le frontend)
   -> supabase service role pour lire profiles WHERE id = userId

3. Verification plan Premium via table subscriptions
   -> SELECT plan, status, end_date FROM subscriptions WHERE entreprise_id = X
   -> Rejet si plan != 'premium' OU status != 'active' OU end_date < now()

4. Rate limiting par entreprise
   -> Cle dans un Map en memoire : derniere execution par entreprise_id
   -> Maximum 1 appel par heure par entreprise
   -> Retourner le cache si appel trop frequent

5. Appel modele IA (google/gemini-2.5-flash via gateway Lovable)
   -> Envoi des stats financieres du mois
   -> Retour resume 2-3 phrases

6. Retour JSON avec resume + timestamp
```

Le controle Premium est fait **cote backend** (pas uniquement frontend). Le frontend affiche un message d'upgrade uniquement pour l'UX, mais la protection reelle est dans l'edge function.

---

### 5. Architecture des composants

```text
src/pages/Dashboard.tsx (conteneur principal, overflow-y-auto active)
  |
  +-- Header + Actions rapides (INCHANGE)
  |
  +-- Toggle "Simple / Avance" (2 boutons style Tabs)
  |
  +-- SI mode = "simple" :
  |     +-- dashboard/SimpleFinanceSummary.tsx    (1 requete -> v_dashboard_simple)
  |     +-- dashboard/SimpleDailyActivity.tsx     (memes donnees de v_dashboard_simple)
  |     +-- dashboard/SimpleChart.tsx             (reutilise FinancialChart tel quel)
  |     +-- Section Clients recents              (existant, inchange)
  |
  +-- SI mode = "avance" ET isPremium ET isActive :
  |     +-- dashboard/AdvancedFinanceDetails.tsx   (1 requete -> v_dashboard_advanced_finance)
  |     +-- dashboard/AdvancedPropertyMetrics.tsx  (1 requete -> v_dashboard_advanced_property)
  |     +-- dashboard/AdvancedTopProperties.tsx    (1 requete -> get_top_properties RPC)
  |     +-- dashboard/AdvancedAlerts.tsx           (1 requete -> v_dashboard_alerts)
  |     +-- dashboard/AdvancedFinancialChartWrapper.tsx (NOUVEAU wrapper, sans modifier FinancialChart)
  |     +-- dashboard/AdvancedAISummary.tsx        (1 appel edge function securisee)
  |
  +-- SI mode = "avance" ET NON Premium :
        +-- dashboard/PremiumUpgradeCard.tsx       (carte verrouillee)
```

---

### 6. Hook `useSubscription`

**`src/hooks/useSubscription.tsx`**

- Requete sur `subscriptions` WHERE `entreprise_id` = profil utilisateur
- Expose : `{ plan, isPremium, isActive, isExpired, isLoading }`
- `isPremium = plan === 'premium' AND status === 'active' AND (end_date === null OR end_date > now())`
- Cache `useQuery` 5 minutes

---

### 7. Hook `useDashboardData`

**`src/hooks/useDashboardData.tsx`**

- Recoit `entrepriseId`, `mode`, `isPremium`
- Mode simple : 1 seule requete vers `v_dashboard_simple`
- Mode avance : 3 requetes parallelisees (finance, property, alerts) + 1 RPC (top properties)
- Aucune requete avancee executee si mode = simple
- Retourne objet structure par section

---

### 8. Resume des fichiers a creer/modifier

| Fichier | Action |
|---------|--------|
| Migration SQL | CREER -- table `subscriptions` + vues + fonction `get_top_properties` |
| `src/hooks/useSubscription.tsx` | CREER |
| `src/hooks/useDashboardData.tsx` | CREER |
| `src/components/dashboard/SimpleFinanceSummary.tsx` | CREER |
| `src/components/dashboard/SimpleDailyActivity.tsx` | CREER |
| `src/components/dashboard/SimpleChart.tsx` | CREER (wrapper passant FinancialChart tel quel) |
| `src/components/dashboard/AdvancedFinanceDetails.tsx` | CREER |
| `src/components/dashboard/AdvancedPropertyMetrics.tsx` | CREER |
| `src/components/dashboard/AdvancedTopProperties.tsx` | CREER |
| `src/components/dashboard/AdvancedAlerts.tsx` | CREER |
| `src/components/dashboard/AdvancedFinancialChartWrapper.tsx` | CREER (nouveau composant, FinancialChart intact) |
| `src/components/dashboard/AdvancedAISummary.tsx` | CREER |
| `src/components/dashboard/PremiumUpgradeCard.tsx` | CREER |
| `supabase/functions/dashboard-ai-summary/index.ts` | CREER (securise : JWT + plan + rate limit) |
| `src/pages/Dashboard.tsx` | MODIFIER -- toggle mode, conditionnel, scroll vertical |

**Fichiers NON modifies** : `FinancialChart.tsx`, sidebar, routes, tables existantes.

