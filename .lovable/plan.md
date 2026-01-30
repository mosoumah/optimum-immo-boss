
Objectif (scope strict)
- Supprimer la barre de scroll horizontale (gauche/droite) sur la page **/taches** uniquement.
- Ne toucher à rien d’autre (pas de dashboard, pas de sidebar, pas de styles globaux).

Constat / Cause probable (d’après le code actuel)
- La page `Taches.tsx` utilise ce layout :
  - Conteneur racine : `div className="min-h-screen flex relative"`
  - Sidebar : `DynamicSidebar` est en `position: fixed` (donc elle ne “prend pas de place” dans le flux du layout)
  - Contenu : `main className="flex-1 lg:ml-64 ..."`
- Problème : en **Flexbox**, un élément `flex-1` prend déjà toute la largeur disponible. Ajouter `lg:ml-64` (16rem de marge) peut provoquer une largeur totale > viewport (car la marge s’ajoute), ce qui déclenche une barre de scroll horizontale en bas.
- Sur d’autres pages, vous ne le voyez pas forcément car certains layouts ont `overflow-hidden` sur le conteneur (ex: Dashboard/AppLayout), ce qui masque le problème. Sur /taches, ce masque n’existe pas, donc la barre apparaît.

Approche de correction (minimaliste, uniquement sur /taches)
- Corriger la cause (éviter le “flex item plein écran + marge” qui dépasse), plutôt que cacher le problème globalement.
- Option la plus propre et limitée à cette page : enlever `flex` du conteneur racine, pour repasser en layout “block” classique où `ml-64` ne crée pas de dépassement (la largeur auto s’ajuste).
- Ajouter en plus une sécurité `overflow-x-hidden` sur le wrapper de la page (toujours uniquement dans `Taches.tsx`) pour empêcher toute micro-débordement (1–2px) lié à un contenu dynamique.

Changements précis (1 seul fichier : `src/pages/Taches.tsx`)
1) Modifier le conteneur racine de la page
- Avant :
  - `<div className="min-h-screen flex relative">`
- Après :
  - `<div className="min-h-screen relative overflow-x-hidden">`
Pourquoi :
- On supprime le comportement Flexbox qui additionne `flex-1` + marge.
- On empêche toute création de scroll horizontal sur cette page uniquement.

2) Ajuster la classe du `<main>` pour être cohérente avec le nouveau wrapper
- Actuellement :
  - `<main className="flex-1 lg:ml-64 mesh-gradient min-h-screen p-4 lg:p-8">`
- Après (proposition simple) :
  - `<main className="w-full lg:ml-64 mesh-gradient min-h-screen p-4 lg:p-8">`
Pourquoi :
- `flex-1` n’est plus utile si le parent n’est plus `flex`.
- `w-full` garantit un comportement de largeur standard.
- `lg:ml-64` continue à décaler le contenu pour ne pas passer sous la sidebar fixe, sans générer de dépassement horizontal.

3) Si un contenu “long” force encore un débordement (sécurité ciblée dans la liste des tâches)
- Si le débordement vient d’un titre/texte très long sans espaces (ex: un code, une URL, etc.), on fera une mini-correction locale :
  - Ajouter `break-words` (ou `break-all` si nécessaire) sur l’affichage du titre (et éventuellement description).
- Exemple :
  - Le titre : ajouter `break-words` et/ou `truncate`
  - L’objectif : empêcher qu’une seule “longue chaîne” pousse la largeur au-delà du viewport.
Note :
- Je commencerai par la correction layout (#1/#2) qui est la cause la plus probable. Le point #3 ne sera appliqué que si nécessaire, et toujours dans `Taches.tsx`.

Vérifications (end-to-end)
- Tester /taches en :
  - Mobile (390px) : vérifier absence de barre horizontale.
  - Tablette / Desktop (≥ 1024px) : vérifier absence de barre horizontale + sidebar visible + contenu correctement aligné.
- Tester avec :
  - Une tâche au titre très long (pour confirmer que le texte ne force pas le débordement).
  - Ouverture du détail de tâche (pour vérifier qu’aucun composant overlay ne crée un overflow inattendu).

Impact attendu
- Plus de scroll horizontal en bas sur /taches.
- Mise en page alignée correctement avec la sidebar fixe.
- Aucun changement sur les autres pages, ni sur les styles globaux.

Fichiers concernés
- Uniquement : `src/pages/Taches.tsx`
