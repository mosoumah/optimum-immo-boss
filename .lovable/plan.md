
# Restructuration du Dashboard Avance

## Probleme actuel
Le mode Avance n'affiche que les widgets avances (Top Properties, Alertes, Graphiques, Resume IA) sans les KPI de base (resume financier, activite du jour, graphique revenus/depenses, clients recents). Le dashboard avance doit inclure **tout le contenu du mode Simple** en plus des widgets avances.

## Structure proposee pour le mode Avance

L'ordre d'affichage sera :

1. **Resume financier** (SimpleFinanceSummary) -- identique au mode Simple
2. **Activite du jour** (SimpleDailyActivity) -- identique au mode Simple
3. **Graphique Revenus vs Depenses + Clients recents** (SimpleChart + liste clients) -- identique au mode Simple
4. ---separateur---
5. **Finances detaillees** (AdvancedFinanceDetails) -- widget avance existant
6. **Indicateurs immobiliers** (AdvancedPropertyMetrics) -- widget avance existant
7. **Top 3 biens + Alertes** (AdvancedTopProperties + AdvancedAlerts) -- widgets avances existants
8. **Graphiques avances** (AdvancedFinancialChartWrapper) -- widget avance existant
9. **Resume IA** (AdvancedAISummary) -- widget avance existant

## Modifications techniques

### 1. `src/hooks/useDashboardData.tsx`
- Modifier la query `simpleQuery` pour qu'elle se declenche aussi en mode `advanced` (pas seulement `simple`), car le mode avance a besoin des memes donnees de base.
- Changer `enabled: !!entrepriseId && mode === "simple"` en `enabled: !!entrepriseId` pour que les donnees simples soient toujours chargees.

### 2. `src/pages/Dashboard.tsx`
- Dans le bloc `dashboardMode === "advanced"`, ajouter les 3 sections du mode Simple **avant** les widgets avances :
  - `SimpleFinanceSummary` avec `dashboardData.simple`
  - `SimpleDailyActivity` avec `dashboardData.simple`
  - Grille `SimpleChart` + `Clients recents`
- Les widgets avances existants restent apres, separes par un diviseur visuel.

### Aucune autre modification
Pas de changement de design, pas de nouveau composant, pas de modification de base de donnees.
