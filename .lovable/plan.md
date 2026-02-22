

# Restructurer la colonne gauche "Revenus vs Depenses" - Design creatif

## Constat actuel
La colonne gauche affiche verticalement 9 elements empiles (label, montant, GNF, variation, "vs prec.", Revenus label, montant revenus, Depenses label, montant depenses). Dans l'espace vertical limite du carreau, ces elements se serrent trop et certains restent caches en bas selon la taille de l'ecran.

## Solution creative : layout compact en 2 zones horizontales
Au lieu d'empiler 9 lignes verticalement, reorganiser la colonne gauche en 2 zones compactes :

### Zone 1 : Benefice + variation sur une seule ligne
- Le montant benefice et la variation cote a cote sur la meme ligne
- Le label "Benefice mois" au-dessus en une seule ligne
- "GNF" fusionne avec le montant (ex: "5.0M GNF" sur une ligne)

### Zone 2 : Revenus et Depenses cote a cote (2 colonnes)
- Au lieu d'empiler Revenus puis Depenses verticalement, les mettre cote a cote dans une mini-grille 2 colonnes
- Chaque colonne : label + montant

## Modifications dans `src/components/FinancialChart.tsx` (lignes 197-224)

### Structure revisee de la colonne gauche :
```
BENEFICE MOIS              (text-[9px], uppercase)
5.0M GNF  [icone] -54.5%  (montant + variation sur meme ligne)
vs mois prec.              (text-[8px])
--------------------------
Revenus    |  Depenses     (grille 2 colonnes, text-[9px])  
6.0M GNF   |  950k GNF    (text-[9px] font-semibold)
```

### Details techniques :
1. **Ligne 197** : garder `justify-start overflow-hidden`, ajouter `gap-0.5` au lieu d'espacements individuels
2. **Lignes 201-204** : fusionner le montant et "GNF" sur une seule ligne avec `inline`, reduire a `text-sm lg:text-base`
3. **Lignes 206-209** : mettre la variation inline avec le montant via un `flex` horizontal
4. **Lignes 214-223** : transformer le bloc vertical en `grid grid-cols-2 gap-x-2 gap-y-0` pour placer Revenus et Depenses cote a cote
5. Reduire toutes les tailles de texte d'un cran supplementaire pour garantir que tout rentre

### Aucun contenu supprime
Tous les elements existants (label benefice, montant, GNF, variation, "vs prec.", revenus, depenses) sont conserves - seule leur disposition change.

## Fichier modifie
- `src/components/FinancialChart.tsx` uniquement (aucune modification du pied de page ni d'autres fichiers)

## Resultat attendu
La colonne gauche utilise l'espace de maniere optimale grace a une disposition plus horizontale. Tous les textes sont visibles sans debordement ni superposition, meme sur des ecrans avec un espace vertical reduit.

