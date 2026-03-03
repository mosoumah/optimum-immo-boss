

# Mise a jour automatique du dashboard en temps reel

## Probleme actuel
Les donnees du dashboard (KPIs financiers, arrivees/departs, graphique) ne se mettent a jour qu'au rechargement de la page. Quand une facture est marquee comme payee ou qu'une reservation est creee, il faut rafraichir manuellement.

## Solution
Utiliser les abonnements temps reel de la base de donnees pour detecter les changements sur les tables cles et rafraichir automatiquement les donnees du dashboard.

## Tables a surveiller
- `factures` : quand un statut change (paye/non_paye), les revenus et KPIs se mettent a jour
- `revenus` : quand un revenu est cree (via le trigger), le graphique et les KPIs se mettent a jour
- `depenses` : quand une depense est ajoutee, le graphique et les KPIs se mettent a jour
- `reservations` : quand une reservation est creee/modifiee, les arrivees/departs se mettent a jour

## Modifications

### 1. Migration SQL : activer le realtime sur les tables
Ajouter les tables `factures`, `revenus`, `depenses`, et `reservations` a la publication `supabase_realtime` pour permettre les abonnements temps reel.

### 2. `src/hooks/useDashboardData.tsx`
- Ajouter un abonnement Supabase Realtime qui ecoute les changements sur `factures`, `revenus`, `depenses`, et `reservations`
- Quand un changement est detecte, invalider les caches react-query correspondants pour forcer un re-fetch automatique
- Nettoyer l'abonnement au demontage du composant

### 3. `src/components/FinancialChart.tsx`
- Ajouter un abonnement Realtime sur `revenus` et `depenses`
- Quand un changement est detecte, re-executer le fetch des donnees du graphique automatiquement

### Ce qui ne change PAS
- La structure des composants du dashboard
- Les vues SQL existantes
- Le formulaire de reservation
- Les RLS policies

## Details techniques

Le hook `useDashboardData` recevra un `queryClient` via `useQueryClient()` pour invalider les caches. Un canal Realtime unique ecoutera les 4 tables et declenchera `queryClient.invalidateQueries()` sur les cles correspondantes.

Pour le `FinancialChart`, un compteur d'etat sera incremente a chaque evenement Realtime, forçant le `useEffect` a re-fetcher les donnees.

