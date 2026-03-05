

# Analyse du graphique Revenus vs Depenses — Problemes identifies et corrections

## Problemes trouves

### 1. Bug de decalage de dates (cause principale)
Le graphique utilise `toISOString().split("T")[0]` pour generer les dates de comparaison. Cette methode convertit en UTC, ce qui peut decaler la date d'un jour selon le fuseau horaire de l'utilisateur.

Exemple : `new Date(2026, 2, 5)` a minuit local en UTC+1 donne `"2026-03-04"` au lieu de `"2026-03-05"`. Les revenus/depenses du jour ne correspondent plus aux bonnes colonnes du graphique.

**Correction** : Utiliser une fonction locale `formatLocalDate(date)` qui extrait `getFullYear()`, `getMonth()+1`, `getDate()` sans conversion UTC.

### 2. Le graphique n'ecoute pas les changements de factures
Le realtime du graphique ecoute uniquement `revenus` et `depenses`. Quand une facture est marquee payee, le trigger `handle_facture_paid` cree un revenu. Le realtime sur `revenus` devrait capter cela, mais ajouter `factures` comme listener rend le systeme plus fiable (double assurance).

**Correction** : Ajouter `.on("postgres_changes", { event: "*", schema: "public", table: "factures" }, ...)` au channel realtime du graphique.

## Fichiers modifies
- **`src/components/FinancialChart.tsx`** :
  - Remplacer tous les `toISOString().split("T")[0]` par une fonction locale `formatLocalDate`
  - Ajouter l'ecoute realtime sur la table `factures`

