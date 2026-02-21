

## Ajustement du sidebar -- Supprimer le defilement

### Probleme actuel

Le sidebar a trop d'elements pour la hauteur de l'ecran, ce qui force un scroll vertical visible (barre de defilement). L'utilisateur souhaite que tout tienne sans defilement.

### Solution

Reduire l'espacement et la taille des elements pour que tout le contenu tienne dans la hauteur de l'ecran sans avoir besoin de scroller.

### Modifications dans `src/components/DynamicSidebar.tsx`

1. **Supprimer `overflow-y-auto`** sur la balise `<nav>` (ligne 100) et remettre `overflow-hidden` pour enlever la barre de defilement
2. **Reduire le padding vertical** des liens de `py-2` a `py-1.5` (lignes 113, 147, 155)
3. **Reduire le padding du logo** de `p-4` a `p-3` (ligne 85)
4. **Reduire l'espacement entre les elements** de `space-y-0.5` a `space-y-0` sur le `<nav>` (ligne 100)
5. **Reduire la taille des icones** de `w-5 h-5` a `w-4 h-4` (lignes 119-120, 149, 156)
6. **Reduire la taille du texte** de `text-sm` a `text-xs` (lignes 124, 150, 157)
7. **Reduire le padding de la section bas** de `p-3` a `p-2` (ligne 141)

### Resultat attendu

Tous les elements du menu (y compris Utilisateurs, Permissions, Parametres, Deconnexion) seront visibles sans aucune barre de defilement, avec un espacement compact mais lisible.

