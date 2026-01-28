

## Plan: Bouton "Assigner tâche" dans le TacheDetailDialog

### Objectif

Ajouter un bouton "Assigner tâche" directement dans le header du TacheDetailDialog (la vue des détails d'une tâche). Ce bouton ouvrira un sélecteur d'utilisateurs permettant de choisir à qui envoyer une nouvelle tâche.

### Architecture de la solution

```text
┌─────────────────────────────────────────────────────────────────────┐
│  TacheDetailDialog (avec nouveau bouton)                            │
├─────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ 📋 Relance des prospects chauds      [📋 Assigner tâche]     │  │
│  │ 🏷 À faire • 27 janvier 2026 • 👤 Mamadou                     │  │
│  │                                                               │  │
│  │ Description de la tâche...                                    │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ Zone de chat...                                               │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                           │
                           ▼ Clic sur "Assigner tâche"
┌─────────────────────────────────────────────────────────────────────┐
│  SÉLECTIONNER UN DESTINATAIRE                                       │
├─────────────────────────────────────────────────────────────────────┤
│  Filtrer: [Tous] [Admin] [Agent] [Client]                           │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ 👤 Admin Boss          [🟣 Admin]                             │  │
│  │ 👤 Mamadou Bah         [🔵 Agent]                             │  │
│  │ 👤 Client ABC          [🟢 Client]                            │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  → Clic sur un utilisateur                                         │
└─────────────────────────────────────────────────────────────────────┘
                           │
                           ▼ QuickTaskDialog s'ouvre
┌─────────────────────────────────────────────────────────────────────┐
│  ASSIGNER UNE TÂCHE                                                 │
├─────────────────────────────────────────────────────────────────────┤
│  👤 Destinataire: Mamadou Bah (Agent)                               │
│                                                                     │
│  Titre de la tâche *                                                │
│  [____________________________________]                             │
│                                                                     │
│  Description (optionnel)                                            │
│  [____________________________________]                             │
│                                                                     │
│  Date d'échéance: [📅 27/01/2026]                                   │
│                                                                     │
│  [Annuler]                      [📋 Envoyer]                        │
└─────────────────────────────────────────────────────────────────────┘
```

### Fichiers a modifier

| Fichier | Action |
|---------|--------|
| `src/components/dialogs/TacheDetailDialog.tsx` | Ajouter bouton "Assigner tâche" + sélecteur d'utilisateurs intégré |

### Ce qui sera modifie dans TacheDetailDialog.tsx

1. **Nouveau bouton dans le header**: Un bouton "Assigner tâche" (icône ClipboardList) placé dans l'en-tête à côté du titre de la tâche

2. **Sélecteur d'utilisateurs intégré**: Un menu déroulant ou popover qui s'ouvre au clic, affichant:
   - Filtres par rôle (Tous / Admin / Agent / Client)
   - Liste des utilisateurs de l'entreprise avec leur nom et badge de rôle
   - Clic sur un utilisateur ouvre le QuickTaskDialog avec ce destinataire

3. **Intégration du QuickTaskDialog**: Le dialog existant sera utilisé pour créer la tâche avec le destinataire pré-sélectionné

### Details techniques

**Nouveau state dans TacheDetailDialog:**
```typescript
const [showUserSelector, setShowUserSelector] = useState(false);
const [roleFilter, setRoleFilter] = useState<string>("all");
const [users, setUsers] = useState<UserWithRole[]>([]);
const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
const [quickTaskOpen, setQuickTaskOpen] = useState(false);
```

**Recuperation des utilisateurs:**
```typescript
// Fetch users from the same entreprise with their roles
const fetchUsers = async () => {
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, nom, email")
    .eq("entreprise_id", entrepriseId);
  
  // Get roles for each user
  for (const profile of profiles) {
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", profile.id)
      .maybeSingle();
    // Add to users list
  }
};
```

**Structure du sélecteur (Popover):**
```text
┌────────────────────────────────────────────┐
│ Sélectionner un destinataire              │
├────────────────────────────────────────────┤
│ [Tous] [Admin] [Agent] [Client]           │
├────────────────────────────────────────────┤
│ 👤 Admin Boss          🟣 Admin           │
│ 👤 Mamadou Bah         🔵 Agent           │
│ 👤 Client ABC          🟢 Client          │
└────────────────────────────────────────────┘
```

### Dependances a ajouter au composant

- Import du QuickTaskDialog existant
- Import du hook useEntreprise pour obtenir l'entrepriseId
- Ajout du Popover pour le sélecteur d'utilisateurs

### Flux utilisateur

1. L'utilisateur ouvre le détail d'une tâche (TacheDetailDialog)
2. Il clique sur le bouton "Assigner tâche" dans le header
3. Un popover s'ouvre avec la liste des utilisateurs (filtrables par rôle)
4. Il sélectionne un destinataire
5. Le QuickTaskDialog s'ouvre avec ce destinataire pré-rempli
6. Il entre le titre, description et date de la tâche
7. Il envoie - la tâche est créée et le destinataire reçoit une notification

### Ce qui ne sera PAS modifie

- Le dashboard
- Les autres pages
- Le DirectMessagePanel (le bouton y reste aussi)
- La logique de chat existante dans TacheDetailDialog
- Le design premium vert-noir déjà implémenté

