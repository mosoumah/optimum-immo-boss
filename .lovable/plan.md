

# Corriger les sections cachees du Dashboard (graphique, accordeon, clients)

## Probleme
Avec `overflow-hidden`, les sections du bas (graphique "Revenus vs Depenses", "Top 3 biens", "Alertes intelligentes", "Resume IA") sont coupees car les sections du haut (`SimpleFinanceSummary` et `SimpleDailyActivity`) ont `flex-shrink-0` et ne se compriment jamais. La grille du bas recoit donc un espace quasi nul.

## Cause racine
1. Les conteneurs des sections "Resume financier" et "Activite du jour" ont `flex-shrink-0`, ce qui les empeche de se reduire
2. Le `div` parent du `SimpleChart` dans la grille (ligne 306 et 381) n'a pas `h-full` ni `min-h-0`, donc le graphique ne peut pas se dimensionner correctement dans le flex
3. Le panneau clients/accordeon n'a pas `min-h-0` pour permettre la compression

## Corrections (uniquement dans Dashboard.tsx)

### 1. Retirer `flex-shrink-0` des sections resume et activite
Remplacer les `div` wrapper avec `flex-shrink-0` par de simples `div` sans contrainte de shrink, pour les deux modes (simple et avance). Cela permet a ces sections de se comprimer proportionnellement si l'espace manque.

Lignes concernees :
- Ligne 288 : `<div className="flex-shrink-0">` -> `<div>`
- Ligne 296 : `<div className="flex-shrink-0">` -> `<div>`
- Ligne 365 : `<div className="flex-shrink-0">` -> `<div>`
- Ligne 372 : `<div className="flex-shrink-0">` -> `<div>`

### 2. Ajouter `h-full min-h-0` au parent du SimpleChart
Pour que le graphique prenne toute la hauteur disponible dans la grille :
- Ligne 306 : `<div className="lg:col-span-2">` -> `<div className="lg:col-span-2 min-h-0">`
- Ligne 381 : idem pour le mode avance

### 3. Ajouter `min-h-0` au panneau clients et accordeon
- Ligne 315 (clients) : ajouter `min-h-0` a la classe du `motion.div`
- Ligne 386 (accordeon) : ajouter `min-h-0 overflow-hidden` au `div` de l'accordeon

## Fichiers modifies
- `src/pages/Dashboard.tsx` uniquement (aucun autre fichier modifie)

## Resultat attendu
Toutes les sections (resume financier, activite du jour, graphique, clients/accordeon) sont visibles dans le viewport. Les sections du haut se compriment legerement si necessaire, et la grille du bas prend l'espace restant avec le graphique et le panneau lateral entierement visibles.

