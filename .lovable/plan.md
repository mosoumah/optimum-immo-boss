

## Plan: Envoi de taches depuis la messagerie + Design premium vert-noir

### Objectif

1. Permettre d'envoyer une tache a un utilisateur selectionne directement depuis le panneau de messagerie (sans avoir a quitter la conversation)
2. Ameliorer le design du chat avec un theme premium degradé vert-noir qui s'integre au style existant de l'application

### Architecture de la solution

```text
┌─────────────────────────────────────────────────────────────────────┐
│                    MESSAGERIE AMELIOREE                             │
├─────────────────────────────────────────────────────────────────────┤
│  1. L'utilisateur selectionne un destinataire                       │
│     → Voit la conversation + nouveau bouton "Assigner tâche"        │
│                                                                     │
│  2. Il clique sur "Assigner tâche"                                  │
│     → Dialog de creation de tache avec le destinataire pre-rempli   │
│                                                                     │
│  3. Il envoie la tache                                              │
│     → Tache creee + notification automatique au destinataire        │
│                                                                     │
│  4. Design premium avec degradé vert-noir                           │
│     → Header avec glow vert, bulles stylisees, fond sombre          │
└─────────────────────────────────────────────────────────────────────┘
```

### Ce qui sera modifie

#### 1. DirectMessagePanel.tsx - Ajout du bouton "Assigner tâche"

Dans l'en-tete de la conversation (quand un utilisateur est selectionne), ajouter un bouton qui ouvre un formulaire rapide pour creer une tache assignee a cet utilisateur.

**Nouveau bouton dans la zone de conversation:**
```text
┌────────────────────────────────────────────────────────────────┐
│  👤 Mamadou Bah                                                │
│  🏷 Agent                     [📋 Assigner tâche]              │
└────────────────────────────────────────────────────────────────┘
```

#### 2. Nouveau composant: QuickTaskDialog

Un dialog simplifie pour creer rapidement une tache depuis la messagerie:
- Titre de la tache (requis)
- Description (optionnel)
- Date (par defaut aujourd'hui)
- Destinataire pre-selectionne (non modifiable)

#### 3. Design premium vert-noir du chat

**Modifications visuelles:**
- Header de conversation avec fond degradé vert-noir
- Zone de messages avec fond semi-transparent sombre
- Bulles de message avec effet glow vert subtil pour les messages envoyes
- Bouton d'envoi avec effet glow vert
- Barre de saisie avec bordure verte subtile
- Separateurs avec degradé vert

**Palette de couleurs:**
- Fond principal: hsl(220, 20%, 6%) - noir profond
- Accent: hsl(72, 100%, 50%) - vert lime
- Bulles envoyees: degradé vert-noir
- Bulles recues: fond gris fonce

### Fichiers a modifier

| Fichier | Action |
|---------|--------|
| `src/components/DirectMessagePanel.tsx` | Ajouter bouton assigner tache + design premium |
| `src/components/dialogs/QuickTaskDialog.tsx` | Creer (dialog simplifie pour creer une tache) |
| `src/components/dialogs/TacheDetailDialog.tsx` | Appliquer le meme design premium |

### Details techniques

**Structure du QuickTaskDialog:**
```typescript
interface QuickTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assigneeId: string;
  assigneeName: string;
  entrepriseId: string;
  onSuccess: () => void;
}
```

**Nouveau design du DirectMessagePanel:**

```text
┌─────────────────────────────────────────────────────────────────────┐
│  🟢 MESSAGERIE           [gradient-header: noir → vert subtil]     │
├──────────────────────┬──────────────────────────────────────────────┤
│  [Liste users]       │  ┌────────────────────────────────────────┐  │
│  fond sombre         │  │ 👤 Mamadou     [📋 Assigner tâche]    │  │
│  highlight vert      │  │ Agent          [glow-header]           │  │
│  au survol           │  ├────────────────────────────────────────┤  │
│                      │  │                                        │  │
│  ┌───────────────┐   │  │   ┌──────────────────────────┐        │  │
│  │ 👤 Admin Boss │   │  │   │ Message recu          │        │  │
│  │ 🟣 Admin     │   │  │   │ [fond gris fonce]      │        │  │
│  ├───────────────┤   │  │   └──────────────────────────┘        │  │
│  │ 👤 Mamadou   │◀──┤  │                                        │  │
│  │ 🔵 Agent     │   │  │        ┌───────────────────────┐       │  │
│  ├───────────────┤   │  │        │ Message envoye      │ 👤    │  │
│  │ 👤 Client X  │   │  │        │ [gradient vert-noir] │       │  │
│  │ 🟢 Client    │   │  │        │ [glow subtil]        │       │  │
│  └───────────────┘   │  │        └───────────────────────┘       │  │
│                      │  │                                        │  │
│                      │  ├────────────────────────────────────────┤  │
│                      │  │ [🟢 Input avec bordure verte] [Send]   │  │
│                      │  └────────────────────────────────────────┘  │
└──────────────────────┴──────────────────────────────────────────────┘
```

**Classes CSS a utiliser:**
- `premium-header` pour l'en-tete avec animation
- `bg-gradient-to-r from-primary/20 to-transparent` pour les highlights
- `shadow-[0_0_20px_hsl(72,100%,50%,0.2)]` pour l'effet glow
- Bulles envoyees: `bg-gradient-to-br from-primary/90 to-primary/70`
- Zone de messages: `bg-black/20` avec `backdrop-blur`

### Experience utilisateur

1. L'admin/agent ouvre la messagerie et selectionne un destinataire
2. Il peut chatter normalement OU cliquer sur "Assigner tâche"
3. Un dialog rapide s'ouvre avec le destinataire pre-rempli
4. Il entre le titre et description, puis envoie
5. La tache est creee et le destinataire est notifie
6. Le design premium offre une experience visuelle moderne et coherente

### Ce qui ne sera PAS modifie

- Le dashboard
- Les autres pages (Clients, Factures, Devis, etc.)
- La structure des tables existantes (taches)
- Les autres dialogues de l'application
- La logique de notifications existante

