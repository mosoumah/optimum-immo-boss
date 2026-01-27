
## Plan: Systeme de chat en temps reel pour les taches

### Objectif

Permettre a l'admin et a l'agent assigne d'echanger des messages dans le contexte d'une tache specifique. L'agent peut repondre "fait", envoyer des preuves, et l'admin peut suivre l'avancement en temps reel.

### Architecture de la solution

```text
┌─────────────────────────────────────────────────────────────────────┐
│                    FLUX DE COMMUNICATION                            │
├─────────────────────────────────────────────────────────────────────┤
│  1. Admin cree une tache et l'assigne a un agent                    │
│     → Agent recoit une notification (deja en place)                 │
│                                                                     │
│  2. L'agent clique sur la tache pour ouvrir le chat                 │
│     → Affiche l'historique des messages                             │
│                                                                     │
│  3. L'agent ecrit un message (ex: "Fait" ou "En cours...")          │
│     → Message enregistre + notification admin                       │
│                                                                     │
│  4. L'admin recoit la notification et repond si necessaire          │
│     → Echange en temps reel via Supabase Realtime                   │
└─────────────────────────────────────────────────────────────────────┘
```

### Modifications a effectuer

#### 1. Migration SQL - Nouvelle table `tache_messages`

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | Identifiant unique |
| tache_id | uuid | Reference vers la tache (FK) |
| user_id | uuid | Auteur du message |
| message | text | Contenu du message |
| created_at | timestamp | Date de creation |

Politiques RLS:
- SELECT: Admin de l'entreprise + agent assigne peuvent voir les messages
- INSERT: Admin de l'entreprise + agent assigne peuvent envoyer des messages

Trigger:
- Quand un message est ajoute, creer une notification pour l'autre partie (admin ou agent)

Activer Realtime:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.tache_messages;
```

#### 2. Nouveau composant: Dialog de detail de tache avec chat

```text
┌─────────────────────────────────────────────────────────────────────┐
│  Tache: Contacter client Diallo                                     │
│  Assignee a: Mamadou Bah                                            │
│  Statut: A faire                Date: 27/01/2026                    │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Admin (14:30)                                                │   │
│  │ Merci de contacter ce client aujourd'hui                     │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │ Mamadou (15:45)                                              │   │
│  │ Client contacte, il confirme son interet. Fait ✓             │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │ Admin (15:50)                                                │   │
│  │ Parfait, merci!                                              │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Ecrire un message...                              [Envoyer]  │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

#### 3. Modification de la page Taches

Rendre chaque tache cliquable pour ouvrir le dialog de detail/chat.

### Fichiers a creer/modifier

| Fichier | Action |
|---------|--------|
| Migration SQL | Creer table `tache_messages` + trigger notification + RLS + Realtime |
| `src/components/dialogs/TacheDetailDialog.tsx` | Creer (dialog avec infos tache + chat en temps reel) |
| `src/hooks/useTacheMessages.tsx` | Creer (hook pour gerer les messages + realtime) |
| `src/pages/Taches.tsx` | Modifier (ajouter onClick pour ouvrir le detail + state pour dialog) |

### Details techniques

**Structure de la table tache_messages:**
```sql
CREATE TABLE public.tache_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tache_id UUID NOT NULL REFERENCES taches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Trigger pour notification:**
Quand un message est ajoute:
- Si l'auteur est l'agent → notifier l'admin (createur de la tache ou admin de l'entreprise)
- Si l'auteur est l'admin → notifier l'agent assigne

**Realtime Subscription:**
```typescript
const channel = supabase
  .channel(`tache-${tacheId}-messages`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'tache_messages',
      filter: `tache_id=eq.${tacheId}`,
    },
    (payload) => {
      setMessages(prev => [...prev, payload.new]);
    }
  )
  .subscribe();
```

**Envoi de message:**
```typescript
const sendMessage = async (message: string) => {
  await supabase.from('tache_messages').insert({
    tache_id: tacheId,
    user_id: user.id,
    message: message,
  });
};
```

### Securite

- RLS sur `tache_messages`: seuls l'admin de l'entreprise et l'agent assigne peuvent lire/ecrire
- Le trigger de notification respecte les regles d'acces
- Pas de fuite d'information entre entreprises

### Experience utilisateur

1. L'admin cree une tache et l'assigne a un agent
2. L'agent recoit une notification et clique dessus
3. Il est redirige vers les taches et peut cliquer sur la tache pour ouvrir le chat
4. Il ecrit "Fait" ou un message de suivi
5. L'admin recoit une notification et peut repondre
6. Les messages apparaissent en temps reel des deux cotes

### Ce qui ne sera PAS modifie

- Le design global de l'application
- Le dashboard
- Les autres pages
- La structure des notifications existantes (on la reutilise)
