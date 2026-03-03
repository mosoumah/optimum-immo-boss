

# Aligner la comptabilite du dashboard avec les donnees reelles

## Probleme identifie

La vue SQL `v_dashboard_simple` qui alimente le dashboard a des filtres incorrects :

1. **Arrivees aujourd'hui** : filtre sur `statut = 'confirmee'` uniquement. Mais quand un client arrive, le statut passe a `'en_cours'`, donc l'arrivee disparait du compteur. Resultat : 0 au lieu de 2.
2. **Departs aujourd'hui** : aucun filtre sur le statut, ce qui peut compter des reservations annulees.
3. **Sejours en cours** : inclut les reservations `confirmee` dont la date d'arrivee est passee sans que le statut ait change, ce qui peut gonfler le chiffre.

Les stats de la page Reservations (calculees cote client) utilisent une logique legerement differente de la vue SQL du dashboard, creant des incoherences.

## Solution

### 1. Migration SQL : corriger la vue `v_dashboard_simple`

Recreer la vue avec les filtres corriges :

- **Arrivees aujourd'hui** : `date_arrivee = CURRENT_DATE AND statut IN ('confirmee', 'en_cours')` -- inclure les arrivees meme si le statut a deja change
- **Departs aujourd'hui** : `date_depart = CURRENT_DATE AND statut IN ('en_cours', 'confirmee')` -- exclure les annulees et terminees
- **Sejours en cours** : `statut IN ('en_cours', 'confirmee') AND date_arrivee <= CURRENT_DATE AND date_depart >= CURRENT_DATE` -- deja correct, pas de changement

### 2. Aligner la page Reservations avec la meme logique

Fichier : `src/pages/Reservations.tsx`

Corriger les calculs cote client (lignes 86-89) pour utiliser exactement la meme logique que la vue SQL :
- `departsToday` : ajouter le filtre `statut IN ('en_cours', 'confirmee')`
- `enCours` : filtrer sur `statut IN ('en_cours', 'confirmee') AND date_arrivee <= today AND date_depart >= today` au lieu de juste `statut === 'en_cours'`

### Ce qui ne change PAS
- Le hook `useDashboardData.tsx` (il lit deja la vue)
- Le composant `SimpleDailyActivity.tsx` (il affiche deja les bons champs)
- Les triggers existants
- Les RLS policies

