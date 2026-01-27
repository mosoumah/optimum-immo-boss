
## Plan: Systeme de notifications en temps reel pour les taches

### Objectif

Quand un admin assigne une tache a un agent, l'agent recoit automatiquement une notification visible via l'icone cloche en haut du tableau de bord. L'agent peut marquer la notification comme lue.

### Architecture de la solution

```text
┌─────────────────────────────────────────────────────────────────────┐
│                    FLUX DE NOTIFICATION                             │
├─────────────────────────────────────────────────────────────────────┤
│  1. Admin cree une tache → assigned_to = agent_id                   │
│                                                                     │
│  2. Trigger SQL detecte l'insertion dans taches                     │
│     → Cree automatiquement une notification                         │
│                                                                     │
│  3. Supabase Realtime ecoute la table notifications                 │
│     → L'agent recoit la notification instantanement                 │
│                                                                     │
│  4. Icone cloche affiche le nombre de notifications non lues       │
│     → L'agent clique pour voir ses notifications                    │
│                                                                     │
│  5. L'agent marque comme lu → badge disparait                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Modifications a effectuer

#### 1. Migration SQL - Nouvelle table `notifications`

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | Identifiant unique |
| user_id | uuid | L'utilisateur destinataire (l'agent) |
| type | text | Type de notification (ex: "nouvelle_tache") |
| titre | text | Titre de la notification |
| message | text | Contenu de la notification |
| lue | boolean | Si la notification a ete lue |
| reference_id | uuid | ID de la tache concernee (optionnel) |
| created_at | timestamp | Date de creation |

Politiques RLS:
- SELECT: Les utilisateurs voient uniquement leurs propres notifications
- UPDATE: Les utilisateurs peuvent marquer leurs notifications comme lues
- DELETE: Les utilisateurs peuvent supprimer leurs notifications

Activer Realtime:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
```

#### 2. Trigger SQL - Creation automatique de notification

Quand une tache est inseree avec un `assigned_to`, creer automatiquement une notification:

```text
TRIGGER: on_tache_assigned
EVENT: AFTER INSERT ON taches
CONDITION: NEW.assigned_to IS NOT NULL
ACTION: INSERT INTO notifications (
  user_id = NEW.assigned_to,
  type = 'nouvelle_tache',
  titre = 'Nouvelle tache assignee',
  message = NEW.titre,
  reference_id = NEW.id
)
```

#### 3. Nouveau composant: `src/components/NotificationBell.tsx`

Remplacer le bouton cloche statique du Dashboard par un composant intelligent:

Fonctionnalites:
- Compte les notifications non lues
- Affiche un badge avec le nombre
- Dropdown avec la liste des notifications
- Bouton pour marquer comme lu
- Realtime: ecoute les nouvelles notifications

```text
┌────────────────────────────┐
│  🔔 (3)                    │  ← Badge avec nombre
├────────────────────────────┤
│  Nouvelle tache assignee   │
│  "Contacter client Diallo" │
│  Il y a 2 minutes     ✓    │  ← Bouton marquer lu
├────────────────────────────┤
│  Nouvelle tache assignee   │
│  "Preparer devis"          │
│  Il y a 1 heure       ✓    │
└────────────────────────────┘
```

#### 4. Hook personnalise: `src/hooks/useNotifications.tsx`

Logique reutilisable:
- Fetch des notifications de l'utilisateur
- Abonnement Realtime pour les nouvelles
- Fonction pour marquer comme lu
- Compteur de non lues

#### 5. Modification: `src/pages/Dashboard.tsx`

Remplacer:
```tsx
<Button variant="ghost" size="icon" className="relative...">
  <Bell className="w-4 h-4" />
  <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
</Button>
```

Par:
```tsx
<NotificationBell />
```

### Fichiers concernes

| Fichier | Action |
|---------|--------|
| Migration SQL | Creer table `notifications` + trigger + RLS + Realtime |
| `src/hooks/useNotifications.tsx` | Creer (hook pour gerer les notifications) |
| `src/components/NotificationBell.tsx` | Creer (composant cloche avec dropdown) |
| `src/pages/Dashboard.tsx` | Modifier (integrer NotificationBell) |

### Details techniques

**Realtime Subscription:**
```typescript
const channel = supabase
  .channel('user-notifications')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`,
    },
    (payload) => {
      // Ajouter la nouvelle notification a l'etat local
      setNotifications(prev => [payload.new, ...prev]);
      // Afficher un toast optionnel
      toast.info(payload.new.titre);
    }
  )
  .subscribe();
```

**Marquer comme lu:**
```typescript
const markAsRead = async (notificationId: string) => {
  await supabase
    .from('notifications')
    .update({ lue: true })
    .eq('id', notificationId);
};
```

### Securite

- RLS sur `notifications`: chaque utilisateur ne voit que ses propres notifications
- Le trigger est execute avec les privileges de la base de donnees (securise)
- Pas de fuite d'information entre entreprises

### Experience utilisateur

1. L'admin cree une tache et l'assigne a un agent
2. L'agent voit immediatement le badge sur l'icone cloche
3. En cliquant, il voit les details de la tache
4. Il peut marquer comme lu pour faire disparaitre le badge
5. Cliquer sur une notification peut rediriger vers la page Taches
