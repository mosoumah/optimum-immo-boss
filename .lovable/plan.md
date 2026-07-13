## Plan

1. **Identifier la cause exacte**
   - Vérifier l’élément “dashboard preview” de la page d’accueil qui utilise l’image `dashboard-preview.png` et l’animation CSS `dashboard-preview-animated`.
   - Confirmer que le problème vient très probablement du rendu combiné `framer-motion` + `useScroll/useTransform` + `overflow-hidden` + calques absolus, qui peut produire un cadrage/coupe incorrecte en production.

2. **Stabiliser le mockup du dashboard**
   - Remplacer le déplacement/rotation dépendant du scroll par une animation CSS autonome et stable, afin que l’aperçu s’affiche toujours correctement en version déployée.
   - Garder le même visuel général : image du dashboard, glow vert, light sweep, badges flottants.
   - Empêcher les badges/flottants de couper ou masquer l’image de façon anormale.

3. **Rendre l’image obligatoire et proprement cadrée**
   - Ajouter des dimensions/aspect-ratio stables autour du mockup.
   - Conserver `loading="eager"` et ajouter si nécessaire `fetchPriority="high"` pour forcer le chargement prioritaire.
   - S’assurer que le conteneur ne crée plus de bande noire ou de recadrage inattendu en production.

4. **Limiter strictement les changements**
   - Modifier uniquement `src/pages/Index.tsx` et, si nécessaire, `src/index.css`.
   - Ne pas toucher au vrai dashboard connecté, aux données, à MCP, à l’authentification ou aux autres pages.

5. **Vérifier visuellement**
   - Tester la page d’accueil avec Playwright en local sur une taille proche de votre capture.
   - Confirmer que l’image du dashboard et son animation restent visibles et correctement cadrées.