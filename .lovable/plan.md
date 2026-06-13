## Plan de correction

1. **Corriger la vraie source du glitch**
   - Le problème ne vient pas seulement de la grille “Caractéristiques”.
   - Sur mobile Chrome, la page détail combine un conteneur scrollable, des animations `framer-motion`, un fond `mesh-gradient` et des particules fixes. Ce mélange provoque des artefacts visuels comme sur la capture : texte dupliqué, bandes horizontales et cartes fantômes.

2. **Stabiliser la page `BienDetail` sur mobile**
   - Remplacer les animations d’entrée autour de la galerie et des infos par des conteneurs statiques sur cette page.
   - Enlever le `transform: translateZ(0)` ajouté précédemment au conteneur scrollable, car les recherches confirment que les transforms peuvent aggraver les bugs de rendu Chrome avec éléments fixes/fonds.
   - Garder un fond opaque solide sur la page détail pour isoler totalement le contenu des effets animés globaux.

3. **Sécuriser la colonne “Caractéristiques”**
   - Adapter `PropertyFeatures` pour mobile : une seule colonne stable sous petit écran, cartes à largeur complète, icônes non compressibles, textes sans `truncate` agressif.
   - Ajouter `min-w-0`, `overflow-hidden` et dimensions stables pour empêcher tout débordement horizontal ou chevauchement.

4. **Corriger les sections en dessous qui se dédoublent visuellement**
   - Appliquer la même logique aux statistiques et à l’historique des réservations : grilles mobiles plus stables, onglets qui peuvent tenir sans dépasser, texte qui revient à la ligne au lieu de se superposer.

5. **Vérification**
   - Ouvrir la page détail d’un bien en viewport mobile.
   - Faire défiler depuis “Caractéristiques” jusqu’à “Historique des réservations”.
   - Vérifier que les cartes ne se superposent plus et que le fond ne produit plus d’artefacts visuels.