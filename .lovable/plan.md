
# Corriger les textes superposes dans "Revenus vs Depenses"

## Probleme
La colonne gauche du graphique a ses textes superposes les uns sur les autres. Le label "BENEFICE MOIS", le montant "5.0M", "GNF", la variation, et les lignes Revenus/Depenses se chevauchent car le conteneur est trop petit verticalement avec `justify-center`. "Depenses" deborde meme en bas du carreau.

## Cause racine
La colonne gauche utilise `justify-center` ce qui essaye de centrer verticalement tous les elements, mais l'espace vertical est insuffisant. Les textes s'empilent sans pouvoir defiler car le parent a `overflow-hidden`.

## Corrections dans `src/components/FinancialChart.tsx`

### 1. Changer le comportement vertical de la colonne gauche (ligne 197)
- Remplacer `justify-center` par `justify-start` pour aligner les textes en haut
- Ajouter `overflow-hidden` pour eviter tout debordement visible

### 2. Reduire davantage les tailles et espacements pour tout faire tenir
- Le label "Benefice" : garder `text-[10px]` mais supprimer `mb-1` -> `mb-0`
- Le montant : reduire de `text-lg lg:text-xl` a `text-base lg:text-lg`
- "GNF" : supprimer `mb-1` -> `mb-0.5`
- La variation badge : reduire le padding `py-0.5` a `py-0`
- "vs mois prec." : supprimer `mt-0.5` -> rien
- Section Revenus/Depenses : reduire `mt-2` a `mt-1`, `space-y-1` a `space-y-0.5`
- Les montants Revenus/Depenses : reduire `text-xs` a `text-[10px]`

## Fichier modifie
- `src/components/FinancialChart.tsx` uniquement (aucune modification du pied de page ni d'autres fichiers)

## Resultat attendu
Tous les textes de la colonne gauche sont visibles, bien espaces sans superposition, et restent a l'interieur du carreau sans debordement.
