
Objectif (scope strict)
- Corriger uniquement la page **/taches** pour que tout le contenu soit :
  1) bien décalé par rapport à la sidebar sur desktop
  2) centré comme les autres pages (Utilisateurs / Permissions)
  3) responsive (sans débordement / éléments masqués)

Diagnostic (pourquoi ça “passe à gauche” et déborde)
- Actuellement, dans `src/pages/Taches.tsx`, le `<main>` a : `p-4 lg:p-8 md:pl-72`.
- Sur desktop (>= 1024px), **`lg:p-8` écrase `md:pl-72`** (car les règles `lg:` sont générées après les `md:` dans Tailwind).  
  Résultat : le padding-left “anti-sidebar” disparaît en desktop → le contenu revient à gauche et passe sous la sidebar fixe.
- Les autres pages “OK” (ex: Permissions) utilisent une structure stable : `lg:ml-64` + wrapper `p-4 lg:p-8` + `max-w-6xl mx-auto`.

Changements à faire (1 seul fichier)
Fichier : `src/pages/Taches.tsx`

1) Revenir à la structure utilisée par les pages centrées (comme GestionPermissions)
- Modifier le `<main>` pour qu’il se comporte comme les autres pages :
  - Enlever le système `md:pl-72` (qui se fait écraser à `lg`)
  - Utiliser `lg:ml-64` pour compenser la sidebar fixe sur desktop
  - Déplacer le padding dans un wrapper interne `p-4 lg:p-8` (comme Permissions)

Concrètement :

A. `<main>` (layout)
- Avant :
  - `className="flex-1 mesh-gradient min-h-screen p-4 lg:p-8 md:pl-72"`
- Après :
  - `className="flex-1 lg:ml-64 mesh-gradient min-h-screen"`

B. Wrapper de padding (centrage + responsive)
- Ajouter juste après l’ouverture du `<main>` :
  - `<div className="p-4 lg:p-8">`
- Et déplacer le contenu existant (`<div className="max-w-6xl mx-auto ...">...</div>`) à l’intérieur.
- Ajouter la fermeture `</div>` juste avant `</main>`.

Pourquoi cette structure marche
- `lg:ml-64` crée un “vrai” espace réservé à gauche uniquement sur desktop (où la sidebar est visible).
- Le padding `p-4 lg:p-8` est indépendant du décalage sidebar, donc plus de conflit/écrasement Tailwind.
- `max-w-6xl mx-auto` re-centre parfaitement le contenu au milieu de la zone disponible (comme les pages Utilisateurs/Permissions).

2) (Optionnel, seulement si un débordement horizontal persiste après #1)
Si après la correction structurelle il reste un débordement (souvent causé par un texte très long sans espaces), je ferai une micro-correction ciblée dans la liste des tâches, sans changer le design :
- Mettre le titre en mode “wrap/truncate” :
  - ajouter `break-words` (ou `truncate`) sur le bloc du titre
- Mettre le bloc droite (icône + date) en `shrink-0` et la date en `whitespace-nowrap`
But : empêcher une ligne de forcer la largeur et créer une barre horizontale.

Vérification end-to-end (après implémentation)
- Ouvrir `/taches` et tester :
  - Desktop (>= 1024px) : contenu bien décalé, centré, rien sous la sidebar
  - Tablette (768–1023px) : contenu plein écran sans décalage inutile, centré
  - Mobile (< 768px) : contenu plein écran, boutons visibles, pas de débordement

Impact
- Aucun changement fonctionnel (création/édition de tâches inchangée)
- Uniquement une correction de structure/layout pour correspondre aux pages “qui marchent” (Utilisateurs/Permissions)
