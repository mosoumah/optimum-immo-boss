
Objectif (scope strict)
- Corriger uniquement la page **/taches** pour que :
  1) le contenu ne passe plus sous la sidebar sur desktop
  2) tout soit **centré** comme les autres pages
  3) la page soit **responsive** (pas de débordement / éléments cachés)

Constat (problème réel dans le code actuel)
- Dans `src/pages/Taches.tsx`, le `<main>` a actuellement :
  - `p-4 lg:p-8 md:pl-72`
- Sur desktop (>= 1024px), `lg:p-8` remet `padding-left` à `2rem` et **écrase** l’effet de `md:pl-72`.
  - Résultat : le contenu n’est plus décalé suffisamment à gauche → il se retrouve **sous la sidebar** (exactement ce qu’on voit sur votre capture).
- En plus, le “décalage sidebar” doit être appliqué au même breakpoint que l’affichage de la sidebar desktop :
  - La sidebar desktop est `hidden lg:flex` (donc visible à partir de `lg`).

Solution (robuste + centrée, sans débordement)
- Revenir à une structure identique aux pages qui marchent, mais en utilisant **padding-left** au lieu d’une marge (`ml-64`) pour éviter les calculs “largeur + marge” qui peuvent créer un overflow horizontal.
- Principe :
  - `<main>` gère uniquement l’espace réservé à la sidebar en desktop : `lg:pl-64`
  - Un wrapper interne gère le padding global : `p-4 lg:p-8`
  - Le contenu reste centré avec `max-w-6xl mx-auto`

Changements à faire (1 seul fichier)
Fichier : `src/pages/Taches.tsx`

1) Sécuriser contre le débordement horizontal (sans masquer des éléments)
- Modifier le wrapper racine :
  - Avant :
    - `<div className="min-h-screen flex relative">`
  - Après :
    - `<div className="min-h-screen flex relative overflow-x-hidden">`

2) Corriger le layout du `<main>` (décalage sidebar stable + centré)
- Remplacer la classe du `<main>` :
  - Avant :
    - `className="flex-1 mesh-gradient min-h-screen p-4 lg:p-8 md:pl-72"`
  - Après :
    - `className="flex-1 mesh-gradient min-h-screen lg:pl-64"`
  Explication :
  - `lg:pl-64` réserve 16rem (largeur sidebar) uniquement quand la sidebar desktop est visible
  - On retire `p-4 lg:p-8` du main pour éviter tout conflit avec le `pl-*`

3) Ajouter un wrapper interne pour le padding (comme les pages centrées)
- Juste après l’ouverture du `<main>`, ajouter :
  - `<div className="p-4 lg:p-8">`
- Puis placer le contenu existant (`<div className="max-w-6xl mx-auto ...">...</div>`) à l’intérieur
- Fermer ce wrapper juste avant `</main>` avec `</div>`

4) Micro-corrections anti-débordement “par contenu” (uniquement dans /taches)
Si un débordement horizontal persiste à cause de textes longs (titres/assignations) :
- Dans la liste des tâches :
  - Ajouter `break-words` sur le titre (le `<div>` qui affiche `{tache.titre}`)
  - Ajouter `truncate min-w-0` sur la ligne “Assignée à …” (pour éviter qu’un nom très long force la largeur)
  - Mettre le bloc de droite (icône + date) en `shrink-0` et la date en `whitespace-nowrap` pour stabiliser l’affichage et empêcher une ligne d’élargir le conteneur

- Dans la section “Suggestions IA” (si affichée) :
  - Sur le conteneur de suggestion : ajouter `min-w-0` au bloc texte (`flex-1 min-w-0`)
  - Mettre le bouton “Ajouter” en `shrink-0`
  - Objectif : empêcher une description longue de pousser le bouton hors écran

Vérification end-to-end (après implémentation)
- Sur `/taches`, vérifier :
  - Desktop (>= 1024px) : contenu bien décalé (pas sous la sidebar), centré, aucun élément coupé
  - Tablette (768–1023px) : pas de décalage inutile, contenu centré, pas de débordement
  - Mobile (< 768px) : boutons visibles, liste lisible, pas de scroll horizontal

Impact
- Aucun changement fonctionnel (création/édition/IA/messages inchangés)
- Uniquement corrections structurelles + micro-ajustements pour rendre /taches centré et responsive
