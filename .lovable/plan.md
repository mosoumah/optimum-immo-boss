

## Plan: Rendre la page Taches responsive et transformer les notifications en messagerie

### Problemes identifies

1. **Page Taches non responsive**: Le contenu est coupe sur la gauche car la marge fixe `ml-64` ne s'adapte pas aux ecrans mobiles
2. **Cloche de notification basique**: Actuellement un simple Popover, l'utilisateur veut un panneau de messagerie complet pour voir et repondre aux notifications

### Fichiers a modifier

| Fichier | Modification |
|---------|--------------|
| `src/pages/Taches.tsx` | Rendre le layout responsive avec margin conditionnelle |
| `src/components/NotificationBell.tsx` | Transformer en panneau de messagerie avec chat |

### Section technique

#### 1. Taches.tsx - Correction responsive

**Ligne 197 - Avant:**
```tsx
<main className="flex-1 ml-64 mesh-gradient min-h-screen p-8">
```

**Apres:**
```tsx
<main className="flex-1 lg:ml-64 mesh-gradient min-h-screen p-4 lg:p-8">
```

Ceci permet a la page de s'afficher correctement sur mobile (sans marge fixe) et desktop (avec marge de 64).

#### 2. NotificationBell.tsx - Transformation en panneau de messagerie

La nouvelle interface utilisera le meme style premium que DirectMessagePanel:

**Structure du nouveau composant:**

```text
+--------------------------------------------------+
|  [Icon]  Notifications            [Tout marquer] |
|  (Header avec gradient vert-noir)                |
+--------------------------------------------------+
|  Liste des notifications (gauche 1/3)            |
|  +-------------------+--------------------------+|
|  | [Notif 1] ●       |  Conversation/Details   ||
|  | [Notif 2]         |  -----------------      ||
|  | [Notif 3]         |  Message de la notif   ||
|  |                   |                          ||
|  |                   |  [Zone de reponse]      ||
|  |                   |  +------------------+   ||
|  |                   |  | Ecrire reponse.. |   ||
|  |                   |  +------------------+   ||
|  +-------------------+--------------------------+|
+--------------------------------------------------+
```

**Fonctionnalites:**
- **Panel Sheet** au lieu du Popover (comme DirectMessagePanel)
- **Liste des notifications** a gauche avec indicateur non-lu
- **Zone de details** a droite quand on selectionne une notification
- **Champ de reponse** pour envoyer un message en reponse
- **Design premium** avec gradients vert-noir, effets de glow, et animations

**Principales modifications du code:**

1. Remplacer `Popover` par `Sheet` (panneau glissant)
2. Ajouter une structure en deux colonnes (liste + conversation)
3. Integrer un systeme de reponse par message (utilisant direct_messages ou un nouveau systeme)
4. Appliquer le theme premium vert-noir avec:
   - Header: `bg-gradient-to-r from-primary/20 via-primary/10 to-transparent`
   - Fond sombre: `bg-[hsl(220,20%,6%)]` et `bg-black/40`
   - Effets glow: `shadow-[0_0_15px_hsl(var(--primary)/0.3)]`
   - Bordures: `border-primary/20`

**Nouveau flux utilisateur:**
1. Cliquer sur la cloche ouvre le panneau
2. Liste des notifications affichee a gauche
3. Cliquer sur une notification la selectionne et affiche ses details
4. Possibilite de repondre en bas de la zone de conversation
5. Marquer comme lu automatiquement lors de la selection

### Resume des changements

| Element | Avant | Apres |
|---------|-------|-------|
| Taches marge | `ml-64` fixe | `lg:ml-64` responsive |
| Taches padding | `p-8` fixe | `p-4 lg:p-8` responsive |
| NotificationBell | Popover simple | Sheet panel complet |
| Interface notif | Liste basique | Chat conversationnel |
| Style notif | Standard | Premium vert-noir avec glow |

### Ce qui ne sera PAS modifie

- La sidebar (DynamicSidebar)
- Le Dashboard
- Les autres pages
- La structure de la base de donnees
- Le hook useNotifications (reutilise)

### Resultat attendu

1. La page Taches s'affichera correctement sur mobile sans contenu coupe
2. Les notifications s'ouvriront dans un panneau elegant style messagerie
3. L'utilisateur pourra voir le detail de chaque notification et y repondre
4. Design coherent avec le reste de l'application (theme premium vert-noir)

