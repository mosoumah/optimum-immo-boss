

# Correction des sauts de page PDF — approche par rendu DOM natif

## Problème fondamental

L'approche actuelle capture tout le document en **une seule image bitmap** (html2canvas), puis tente de découper cette image en pages. L'algorithme de "densité d'encre" cherche des bandes blanches entre les lignes, mais avec un `line-height: 2` et un `fontSize: 19px` à `scale: 2`, l'espacement inter-lignes en pixels est très serré (~8-10px réels), ce qui rend la détection de gaps fiable quasi impossible. Le résultat : des phrases coupées en deux entre les pages.

## Solution : rendu page par page via jsPDF natif

Abandonner l'approche "une grosse image découpée" au profit d'un **rendu jsPDF textuel structuré**. Cependant, cela impliquerait de réécrire entièrement le rendu, ce qui est trop lourd.

## Solution retenue : augmenter la fiabilité du découpage

1. **Augmenter la bande de scan** de 5px à 40px (couvre une ligne entière de texte) pour détecter les vrais espaces inter-paragraphes plutôt que les micro-gaps entre lignes.

2. **Augmenter la plage de recherche** de 15% à 25% de la hauteur de page, donnant plus de marge pour trouver un espace inter-paragraphe.

3. **Augmenter le seuil d'encre** : considérer un pixel comme "encre" seulement si `< 200` (au lieu de `< 230`), pour ignorer les dégradés légers du fond.

4. **Ajouter un padding vertical** entre les tranches : quand on découpe à un point donné, reculer de ~20px au-dessus et commencer la page suivante ~20px en-dessous, créant un micro-espace qui évite de couper le haut/bas d'un glyphe.

5. **Forcer la recherche de gaps entre paragraphes** : scanner des bandes de 40px et exiger une densité < 0.03 (quasi-vide sur toute la bande) avant d'accepter un point de coupure.

## Fichier modifié

**`src/components/dialogs/ViewDocumentDialog.tsx`** — uniquement la fonction `findSafeBreakPoint` et la boucle de pagination dans `handleDownloadPDF`.

### Détails des changements :

- `bandHeight` : 5 → 40 (couvre une ligne complète)
- `searchRange` : 15% → 25% de pageHeightPx
- Seuil d'encre : `< 230` → `< 200`
- Sampling : chaque pixel au lieu de 1/4 pour plus de précision
- Ajout d'un "padding de sécurité" de 10px au point de coupure (la tranche s'arrête 10px avant le break, la suivante commence 10px après)
- Seuil d'acceptation immédiate : `< 0.01` → `< 0.02`

Aucune modification sur `DocumentPreview.tsx` ni sur l'edge function.

