

## Plan: Messagerie directe avec filtrage par rôle et design amélioré

### Objectif

Permettre d'envoyer des messages directs à n'importe quel utilisateur (admin, agent, client) de l'entreprise. L'interface permet de filtrer par rôle, de voir le nom de chaque personne, et d'échanger en temps réel. Le design du chat sera modernisé avec avatars et mise en page soignée.

### Architecture de la solution

```text
┌─────────────────────────────────────────────────────────────────────┐
│                    MESSAGERIE DIRECTE                               │
├─────────────────────────────────────────────────────────────────────┤
│  1. L'utilisateur ouvre le panneau de messagerie                    │
│     → Voit la liste des utilisateurs de son entreprise             │
│                                                                     │
│  2. Il peut filtrer par rôle (Tous / Admin / Agent / Client)        │
│     → Chaque utilisateur affiche son nom et badge de rôle          │
│                                                                     │
│  3. Il sélectionne un destinataire                                  │
│     → Ouvre la conversation avec cette personne                     │
│                                                                     │
│  4. Les messages s'affichent en temps réel (Supabase Realtime)      │
│     → Design modernisé avec avatars et bulles de chat              │
└─────────────────────────────────────────────────────────────────────┘
```

### Ce qui sera modifie

#### 1. Migration SQL - Nouvelle table `direct_messages`

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | Identifiant unique |
| sender_id | uuid | Auteur du message |
| receiver_id | uuid | Destinataire du message |
| entreprise_id | uuid | Entreprise (pour isolation) |
| message | text | Contenu du message |
| read | boolean | Si lu par le destinataire |
| created_at | timestamp | Date d'envoi |

Politiques RLS:
- SELECT: L'utilisateur voit les messages ou il est sender ou receiver
- INSERT: L'utilisateur peut envoyer des messages a quelqu'un de la meme entreprise

Activer Realtime sur cette table.

#### 2. Nouveau hook: `src/hooks/useDirectMessages.tsx`

- Recuperer la liste des utilisateurs de l'entreprise avec leurs roles
- Filtrer par role (admin, agent, client)
- Recuperer les messages entre deux utilisateurs
- Envoyer un message
- Subscription realtime pour les nouveaux messages

#### 3. Nouveau composant: `src/components/DirectMessagePanel.tsx`

Interface complete de messagerie:

```text
┌─────────────────────────────────────────────────────────────────────┐
│  MESSAGERIE                                          [X]            │
├─────────────────────────────────────────────────────────────────────┤
│  Filtrer: [Tous ▼] [Admin] [Agent] [Client]                         │
├──────────────────────┬──────────────────────────────────────────────┤
│  Liste utilisateurs  │  Conversation                                │
│  ┌────────────────┐  │  ┌──────────────────────────────────────┐    │
│  │ 👤 Mamadou     │  │  │  ┌──────────────────────────────┐   │    │
│  │ 🏷 Agent       │◀─┤  │  │ 👤 Bonjour, comment ca va?  │   │    │
│  ├────────────────┤  │  │  └──────────────────────────────┘   │    │
│  │ 👤 Admin Boss  │  │  │                                      │    │
│  │ 🏷 Admin       │  │  │  ┌──────────────────────────────┐   │    │
│  ├────────────────┤  │  │  │ Tout va bien, merci!    👤  │   │    │
│  │ 👤 Client ABC  │  │  │  └──────────────────────────────┘   │    │
│  │ 🏷 Client      │  │  │                                      │    │
│  └────────────────┘  │  └──────────────────────────────────────┘    │
│                      │  ┌──────────────────────────────────────┐    │
│                      │  │ Ecrire un message...        [Envoyer]│    │
│                      │  └──────────────────────────────────────┘    │
└──────────────────────┴──────────────────────────────────────────────┘
```

#### 4. Amelioration du design du chat existant (TacheDetailDialog)

- Ajouter des avatars avec initiales colorees
- Arrondir davantage les bulles de message
- Ameliorer les espacements et ombres
- Ajouter une indication de statut en ligne (optionnel)

### Fichiers a creer/modifier

| Fichier | Action |
|---------|--------|
| Migration SQL | Creer table `direct_messages` + RLS + Realtime |
| `src/hooks/useDirectMessages.tsx` | Creer (hook pour la messagerie directe) |
| `src/components/DirectMessagePanel.tsx` | Creer (panneau de messagerie complet) |
| `src/components/dialogs/TacheDetailDialog.tsx` | Modifier (ameliorer le design du chat) |
| `src/pages/Taches.tsx` | Modifier (ajouter bouton pour ouvrir la messagerie) |

### Details techniques

**Structure de la table direct_messages:**
```sql
CREATE TABLE public.direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  entreprise_id UUID NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Recuperation des utilisateurs avec role:**
```typescript
// Fetch profiles de l'entreprise
const { data: profiles } = await supabase
  .from("profiles")
  .select("id, nom, email")
  .eq("entreprise_id", entrepriseId);

// Pour chaque profil, recuperer le role
for (const profile of profiles) {
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", profile.id)
    .maybeSingle();
  // Ajouter role au profil
}
```

**Filtrage par role:**
```typescript
const filteredUsers = users.filter(u => 
  selectedRole === "all" || u.role === selectedRole
);
```

**Realtime Subscription:**
```typescript
supabase.channel('direct-messages')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'direct_messages',
      filter: `receiver_id=eq.${currentUserId}`,
    },
    (payload) => {
      // Ajouter le nouveau message
    }
  )
  .subscribe();
```

### Design ameliore du chat

Modifications visuelles:
- Avatars avec initiales (premiere lettre du nom)
- Couleurs differentes selon le role (admin: violet, agent: bleu, client: vert)
- Bulles plus arrondies avec ombres douces
- Animation d'apparition des messages
- Horodatage plus discret

```text
┌──────────────────────────────────────────────────────────────────┐
│  ┌───┐                                                           │
│  │ M │  Mamadou                                                  │
│  └───┘  ┌───────────────────────────────────────────┐           │
│         │ Bonjour, la tache est terminee ✓          │           │
│         └───────────────────────────────────────────┘           │
│                                              Il y a 5 min       │
│                                                                  │
│                        ┌───────────────────────────────┐  ┌───┐ │
│                        │ Parfait, merci beaucoup!      │  │ A │ │
│                        └───────────────────────────────┘  └───┘ │
│                                              Il y a 2 min       │
└──────────────────────────────────────────────────────────────────┘
```

### Securite

- RLS sur `direct_messages`: chaque utilisateur ne voit que ses propres conversations
- Verification que sender et receiver appartiennent a la meme entreprise
- Pas de fuite d'information entre entreprises

### Ce qui ne sera PAS modifie

- Le dashboard
- Les autres pages (Clients, Factures, Devis, etc.)
- La structure des notifications existantes
- Le design global de l'application

