

## Correction de la responsivite de /taches

### Probleme identifie
Sur l'ecran actuel (capture et verification en direct), on voit :
- Le bouton "Suggestions IA" est coupe a droite
- Le bouton "Nouvelle tache" est completement invisible
- Les dates et icones de message a droite de chaque tache ne sont pas visibles
- Les descriptions longues poussent le contenu hors de la zone visible

### Cause racine
Le `overflow-hidden` sur le conteneur `max-w-6xl` coupe tout ce qui depasse. Mais le vrai probleme est que le contenu interne (boutons, lignes de taches) n'est pas correctement contraint en largeur.

### Corrections (fichier unique : `src/pages/Taches.tsx`)

**1) Retirer `overflow-hidden` du conteneur principal**
- Ligne 199 : `max-w-6xl mx-auto relative z-10 overflow-hidden`
- Devient : `max-w-6xl mx-auto relative z-10`
- Ce `overflow-hidden` cache les boutons et le contenu a droite

**2) Ajouter `w-full` au conteneur pour forcer le respect de la largeur parente**
- Ligne 199 : ajouter `w-full` pour que `max-w-6xl` ne depasse jamais la largeur disponible
- Resultat : `max-w-6xl mx-auto relative z-10 w-full`

**3) Contraindre les lignes de taches avec `overflow-hidden` au bon niveau**
- Ligne 303 : le conteneur de chaque tache (`p-4 flex items-center gap-4 ...`)
- Ajouter `overflow-hidden` sur cette ligne pour que le texte long ne force pas la largeur du parent
- Resultat : `p-4 flex items-center gap-4 hover:bg-secondary/30 transition-colors premium-list-item cursor-pointer overflow-hidden`

**4) Reduire le `gap` des lignes de taches sur mobile**
- Ligne 303 : changer `gap-4` en `gap-2 sm:gap-4` pour gagner de l'espace sur petit ecran

**5) Masquer la date sur tres petit ecran**
- Ligne 340 : `<span className="text-sm text-muted-foreground whitespace-nowrap">`
- Ajouter `hidden sm:inline` pour masquer la date sous 640px et liberer de l'espace

### Resume des changements
- 1 fichier modifie : `src/pages/Taches.tsx`
- 4 lignes impactees
- Aucun changement fonctionnel, uniquement du CSS responsive
