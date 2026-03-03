
Objectif: corriger définitivement les coupures de texte entre pages dans le PDF, sans toucher au design/structure visuelle du document.

1) Diagnostic précis du bug actuel
- Le découpage “safe break” scanne une ligne sur toute la largeur du canvas.
- Or `DocumentPreview` contient des éléments décoratifs non blancs sur toute la hauteur (barres latérales, dégradés), donc la détection “ligne blanche” échoue souvent.
- Résultat: fallback sur la position idéale brute => coupure possible au milieu d’une ligne de texte.

2) Correctif ciblé dans `src/components/dialogs/ViewDocumentDialog.tsx` (seul fichier)
- Remplacer `findSafeBreakPoint` par un algorithme de “faible densité d’encre” plus robuste:
  - Scanner uniquement la zone centrale utile du contenu (exclure marges/décors latéraux, ex: 8–10% à gauche/droite).
  - Évaluer une bande de plusieurs pixels (pas 1 seule ligne) pour lisser l’anti-aliasing.
  - Chercher le meilleur point autour de la coupure idéale en priorité vers le haut, puis vers le bas (fenêtre ±searchRange), et choisir la bande avec la plus faible densité.
- Ajouter des garde-fous de pagination:
  - `minSliceHeightPx` pour éviter des pages trop petites si un break “safe” est trop proche.
  - Si aucun bon break n’est trouvé, fallback contrôlé (position idéale mais contrainte par min/max) pour garantir la progression et éviter toute boucle/duplication.
- Conserver tout le reste tel quel:
  - largeur A4, capture html2canvas, CORS, rendu par page, numérotation, marges, styles.

3) Critères “ultra-professionnels” visés (sans changer le design)
- Aucune ligne/phrase coupée en deux à la jonction des pages dans les cas normaux.
- Continuité visuelle propre (pas de saut, pas de chevauchement, pas de duplication de bande).
- Pagination stable sur documents courts et longs.

4) Validation après implémentation
- Tester au moins 3 contenus:
  - texte dense sans interlignes,
  - texte avec sections/titres/listes,
  - texte très long (plusieurs pages).
- Vérifier manuellement les jonctions de chaque page et l’intégrité complète du texte exporté.

5) Portée garantie
- Modification uniquement de la logique de découpage PDF dans `ViewDocumentDialog.tsx`.
- Aucun changement du design, de la structure React, ni du rendu visuel du `DocumentPreview`.
