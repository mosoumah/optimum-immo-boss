## Objectif

Ajouter une troisième série **Taux de réservation** (en gris) au graphique « Revenus vs Dépenses » du tableau de bord, avec sa légende en haut à droite et son indicateur en bas à gauche aux côtés des blocs Revenus / Dépenses. Améliorer subtilement le design du graphique sans toucher au reste du dashboard.

## Ce qui change

### 1. Calcul du taux de réservation (`src/components/FinancialChart.tsx`)

- Charger les réservations de l'entreprise (table `reservations`, colonnes `date_debut`, `date_fin`, `statut`) sur les périodes courante et précédente, en parallèle des `revenus` / `depenses` existants.
- Charger le nombre total de biens actifs de l'entreprise (table `properties`, statut ≠ archivé) — utilisé comme dénominateur.
- Pour chaque jour affiché (7 jours en mode Semaine, N jours en mode Mois) :
  - `biens_occupés_jour` = nombre de réservations dont `date_debut <= jour <= date_fin` et `statut ∈ ('confirmee','en_cours','en_attente')`.
  - `taux = biens_occupés_jour / total_biens × 100` (0 si aucun bien).
- Conserver la même logique `formatLocalDate` existante (pas de décalage UTC).
- Souscription Realtime : ajouter `reservations` et `properties` à la liste des tables qui déclenchent un refresh (déjà géré par `realtimeTick`).

### 2. Affichage dans le graphique

- Ajouter une `Area` Recharts pour `taux` :
  - Couleur ligne : `#9ca3af` (gris neutre, lisible sur fond sombre).
  - Dégradé subtil `gradientTaux` (gris, opacité 0.15 → 0).
  - `strokeDasharray="4 4"` pour différencier visuellement de revenus/dépenses (continus).
  - Axe Y secondaire à droite (`yAxisId="right"`) gradué 0–100 % pour ne pas écraser les courbes monétaires.
- Légende en haut à droite : ajouter une 3ᵉ pastille « Taux de réservation » à côté de Revenus/Dépenses (point gris).
- Tooltip : afficher la valeur en `xx.x %` quand la série est `taux`, en GNF pour les autres.

### 3. KPI en bas à gauche (sous Revenus / Dépenses)

Dans le bloc résumé bénéfice (colonne gauche du chart), la grille actuelle `grid-cols-2` affiche Revenus / Dépenses. La transformer en `grid-cols-3` avec une 3ᵉ cellule :

```
Revenus      Dépenses     Taux résa
7.4M GNF     1.0M GNF     46 %
```

- Couleur valeur : gris clair (`text-muted-foreground` accentué) avec un léger glow gris.
- Calcul affiché : moyenne du `taux` sur la période courante (et delta vs période précédente non requis ici — on reste minimaliste).

### 4. Polish design (graphique uniquement)

Améliorations visuelles ciblées, sans toucher aux autres composants du dashboard :

- Ajouter un très léger halo gris derrière la pastille de légende « Taux de réservation » (cohérent avec les pastilles vert/rouge existantes).
- Adoucir le `CartesianGrid` (opacité 0.15 au lieu de 0.2) pour mieux faire ressortir les 3 courbes.
- Animation d'entrée des courbes (`isAnimationActive` déjà par défaut, ajuster `animationDuration={900}` pour un rendu plus premium).
- Titre du panneau (`SimpleChart.tsx`) inchangé.

## Détails techniques

- Aucune migration SQL nécessaire : `reservations` et `properties` sont déjà accessibles via RLS `entreprise_id`.
- Pas de nouvelle dépendance.
- Garder l'ensemble des calculs côté client dans `useMemo`, comme l'existant.
- Respecter la mémoire projet : utiliser `formatLocalDate` (déjà présent), pas de `toISOString()`, devise GNF intacte.

## Fichiers modifiés

- `src/components/FinancialChart.tsx` — ajout données réservations/biens, série `taux`, axe Y droit, KPI 3ᵉ colonne, polish léger.

Aucun autre fichier modifié.
