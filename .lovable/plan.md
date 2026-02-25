

# Rendre la scrollbar du Résumé IA plus petite et discrète

## Fichier modifié
- `src/components/dashboard/AdvancedAISummary.tsx`

## Changement
Dans le div scrollable (qui contient le texte du résumé), remplacer les classes `scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent` par un style CSS personnalisé inline ou via des classes Tailwind plus fines :
- Largeur de la scrollbar réduite à 3px (au lieu de la taille par défaut de `scrollbar-thin`)
- Thumb (poignée) semi-transparent avec coins arrondis
- Track complètement invisible
- La scrollbar n'apparaît qu'au survol du conteneur (hover)

Cela se fera via une balise `style` dans le JSX ou des classes CSS utilitaires avec `[&::-webkit-scrollbar]` de Tailwind.

