

# Ameliorer la lisibilite des textes dans "Revenus vs Depenses"

## Constat
Les textes dans la colonne gauche sont trop petits pour etre lus confortablement. Les tailles actuelles vont de `text-[9px]` a `text-[11px]` pour la plupart des elements, ce qui rend la lecture difficile.

## Ajustements prevus dans `src/components/FinancialChart.tsx`

### Augmentation des tailles de texte (lignes 197-224)
- **Label "Benefice mois/semaine"** (ligne 198) : `text-[10px]` vers `text-[11px]`
- **Montant benefice** (ligne 202) : conserver `text-base lg:text-lg` (deja bien)
- **"GNF"** (ligne 205) : `text-[10px]` vers `text-[11px]`
- **Variation pourcentage** (ligne 206) : `text-[10px]` vers `text-[11px]`
- **"vs mois prec."** (ligne 211) : `text-[9px]` vers `text-[10px]`
- **Labels "Revenus" / "Depenses"** (lignes 217, 221) : `text-[9px]` vers `text-[10px]`
- **Montants revenus/depenses** (lignes 218, 222) : `text-[11px]` vers `text-xs` (12px)

### Ajustements de design subtils
- Augmenter legerement la largeur minimale : `min-w-[110px]` vers `min-w-[120px]` pour donner plus de place aux textes agrandis
- Augmenter l'opacite des couleurs de texte secondaires : `text-muted-foreground/60` vers `/70` et `/70` vers `/80` pour un meilleur contraste

## Fichier modifie
- `src/components/FinancialChart.tsx` uniquement

## Resultat attendu
Tous les textes gagnent 1-2px de taille, ce qui ameliore nettement la lisibilite tout en restant dans les limites du carreau. Les couleurs plus opaques renforcent le contraste.
