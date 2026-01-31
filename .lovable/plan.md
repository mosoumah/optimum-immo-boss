
Contexte et objectif (scope strict)
- Vous signalez que la page **Tâches** “déborde” et n’est pas responsive : certaines actions (ex. “Nouvelle tâche / Ajouter une nouvelle tâche”) ne sont pas visibles selon la largeur écran.
- Objectif : corriger le responsive **uniquement** sur `/taches`, sans toucher aux autres pages.

Diagnostic (cause la plus probable)
1) Décalage sidebar vs breakpoint Tailwind
- La sidebar passe en “mode desktop” dès **768px** (voir `useIsMobile()` : `< 768` = mobile).
- Dans `Taches.tsx`, le contenu est décalé seulement à partir de `lg:` (1024px) via `lg:ml-64`.
- Conséquence : entre **768px et 1023px** (petits laptops, tablettes paysage), la sidebar desktop est visible, mais le contenu n’est pas assez décalé → une partie passe sous la sidebar, donnant l’impression de “non responsive” (boutons/texte partiellement invisibles).

2) “Fix” actuel qui masque le problème en coupant le contenu
- Le wrapper actuel de `/taches` a `overflow-x-hidden`.
- Si le layout provoque encore un léger overflow, ce `overflow-x-hidden` supprime la barre de scroll… mais peut aussi **couper** ce qui dépasse (donc un bouton peut devenir invisible au lieu d’être scrollable).

Approche de correction (uniquement /taches)
- Aligner le breakpoint de décalage du contenu sur celui de la sidebar (768px = `md:`).
- Éviter les layouts qui créent un overflow horizontal (et donc éviter d’avoir à “cacher” avec overflow-x-hidden).
- Garder la structure “centrée” identique aux autres pages : `max-w-6xl mx-auto` + padding responsive.

Changements précis (1 fichier)
Fichier : `src/pages/Taches.tsx`

1) Corriger le décalage lié à la sidebar (breakpoint)
Option recommandée (robuste, sans overflow) : remplacer le décalage par marge (`ml-64`) par un décalage par padding gauche sur le main, calé sur `md:` :
- Remplacer dans `<main ...>` :
  - Avant : `className="flex-1 lg:ml-64 mesh-gradient min-h-screen p-4 lg:p-8"`
  - Après : `className="flex-1 mesh-gradient min-h-screen p-4 lg:p-8 md:pl-72"`
Pourquoi `md:pl-72` ?
- 72 = 18rem = 16rem (sidebar) + 2rem (padding “desktop” habituel).
- Cela reproduit l’alignement visuel des pages qui font `ml-64` + `p-8`, tout en évitant le “width + margin = dépassement”.
- Et surtout : le décalage s’active dès `md` (768), cohérent avec la sidebar.

2) Retirer le `lg:ml-64` (puisqu’on utilise le padding-left)
- Supprimer complètement `lg:ml-64` du `<main>`.

3) Revoir le `overflow-x-hidden` de la page Tâches
- Après la correction ci-dessus, le contenu ne devrait plus déborder horizontalement.
- Donc je vais :
  - soit retirer `overflow-x-hidden` du wrapper racine `/taches` (préférable : on évite de couper du contenu),
  - soit le laisser uniquement si un micro-débordement (1–2px) persiste (mais alors on doit être sûr que rien n’est coupé).
Recommandation : le retirer et vérifier : si aucune barre horizontale ne réapparaît, c’est gagné.

4) (Optionnel, seulement si nécessaire) Empêcher un débordement “par contenu”
Si après #1-#3 il reste un débordement, alors ce n’est plus le layout sidebar, mais un contenu qui force la largeur (ex: nom assigné très long, titre sans espaces, etc.). Dans ce cas, correction ciblée dans la liste :
- Ajouter `truncate` ou `break-words` sur `tache.titre`
- Ajouter `truncate` sur la ligne “Assignée à: …”
- Mettre `shrink-0` sur le bloc de droite (icône + date) pour stabiliser l’alignement
Important : je ne ferai ce point #4 que si le problème persiste après la correction structurelle, pour rester strictement dans votre scope.

Vérification (end-to-end)
- Tester `/taches` aux largeurs suivantes :
  - 390px (mobile) : hamburger sidebar, contenu full width, aucun débordement.
  - 800–900px (petit laptop) : sidebar desktop visible + contenu correctement décalé, bouton “Nouvelle tâche” visible.
  - 1366px+ (desktop) : même comportement, tout visible, pas de barre horizontale.

Impact attendu
- La page Tâches devient réellement responsive (notamment entre 768 et 1023px).
- Le contenu reste centré comme les autres sections (même “logique” de largeur max + centrage).
- Le bouton “Nouvelle tâche / Ajouter une nouvelle tâche” n’est plus coupé/masqué.
