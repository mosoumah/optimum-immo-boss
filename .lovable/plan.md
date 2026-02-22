

# Corriger la structure des textes dans "Revenus vs Dépenses"

## Probleme
La colonne gauche du graphique (benefice, variation, revenus/depenses) utilise des tailles de texte et espacements trop grands pour l'espace comprime du dashboard. Le texte "5.0M" en `text-xl lg:text-2xl` est disproportionne, les marges (`mb-2`, `mt-3`, `space-y-1.5`) prennent trop de place, et le tout donne un rendu encombre.

## Corrections dans `src/components/FinancialChart.tsx`

### 1. Reduire l'espacement du header (ligne 161)
- `mb-2` -> `mb-1` pour le header avec les boutons Semaine/Mois

### 2. Reduire la colonne gauche benefice (lignes 197-224)
- Reduire la largeur minimale : `min-w-[120px]` -> `min-w-[100px]`
- Benefice montant : `text-xl lg:text-2xl` -> `text-lg lg:text-xl` (ligne 201)
- Supprimer le `mb-2` apres "GNF" -> `mb-1` (ligne 204)
- Reduire l'espace avant revenus/depenses : `mt-3` -> `mt-2` (ligne 214)
- Reduire l'espacement des items : `space-y-1.5` -> `space-y-1` (ligne 214)

### 3. Reduire le gap entre les colonnes (ligne 195)
- `gap-3` -> `gap-2` pour rapprocher la colonne gauche et le graphique

## Fichier modifie
- `src/components/FinancialChart.tsx` uniquement

## Resultat attendu
Les textes dans la colonne gauche sont plus compacts et proportionnes a l'espace disponible. Le graphique a droite gagne un peu plus de place. L'ensemble reste lisible sans encombrement.

