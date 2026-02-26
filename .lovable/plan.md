
# Agrandir la scrollbar au survol du bloc Résumé IA

## Fichier modifié
- `src/components/dashboard/AdvancedAISummary.tsx` (ligne 60)

## Changement
Ajouter une transition sur la largeur de la scrollbar et passer de 3px a 6px au survol du conteneur :
- Ajouter `[&::-webkit-scrollbar]:transition-all` pour une transition fluide
- Ajouter `hover:[&::-webkit-scrollbar]:w-[6px]` pour agrandir la scrollbar au survol du bloc
- La scrollbar revient a 3px quand la souris quitte le bloc
