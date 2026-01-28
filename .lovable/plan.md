

## Plan: Simplifier le TacheDetailDialog pour l'assignation directe de tâches IA

### Objectif

Transformer le `TacheDetailDialog` en un dialog simple et efficace pour assigner directement une tâche IA (suggestion) à un utilisateur. Supprimer la zone de messagerie qui n'a pas sa place ici.

### Ce qui sera supprime

1. **Zone de messagerie** (lignes 294-376) - Les messages se font dans le DirectMessagePanel
2. **Zone d'input de message** (lignes 378-400) - Inutile sans messagerie
3. **Hook useTacheMessages** - Plus necessaire
4. **QuickTaskDialog** - On assigne la tache existante, pas besoin de creer une nouvelle
5. **States inutiles** - newMessage, messagesEndRef, etc.

### Ce qui sera conserve

1. Header avec titre de la tache
2. Badge de statut (A faire / Fait)
3. Date de la tache
4. Description (si presente)
5. Bouton "Assigner tache" avec le popover de selection d'utilisateurs

### Nouveau comportement

Quand l'utilisateur selectionne un destinataire dans le popover:
1. La tache actuelle est mise a jour avec `assigned_to = user.id`
2. Une notification est creee pour le destinataire
3. Un toast de succes s'affiche
4. Le dialog se ferme

### Fichier a modifier

| Fichier | Modification |
|---------|--------------|
| `src/components/dialogs/TacheDetailDialog.tsx` | Refactoring complet |

### Structure finale du dialog

```text
┌─────────────────────────────────────────────────────────────────────┐
│  📋 Preparation des contrats de vente/location                      │
│  🏷 A faire  •  28 janvier 2026                                      │
│                                                                     │
│  Rassembler tous les documents necessaires (titres de propriete,   │
│  diagnostics, pieces d'identite) et rediger les projets de         │
│  contrats en conformite avec la legislation guineenne.             │
│                                                                     │
│  [📋 Assigner tache]                                                │
│                                                                     │
│         Clic → Popover selection utilisateur                        │
│                    ↓                                                │
│         Selection → UPDATE taches SET assigned_to = ?               │
│                    ↓                                                │
│         Notification creee → Dialog ferme                           │
└─────────────────────────────────────────────────────────────────────┘
```

### Code de la nouvelle fonction handleSelectUser

```typescript
const handleSelectUser = async (user: UserWithRole) => {
  if (!tache) return;
  
  setIsAssigning(true);
  try {
    // Mettre a jour la tache avec le nouvel assignee
    const { error: updateError } = await supabase
      .from("taches")
      .update({ assigned_to: user.id })
      .eq("id", tache.id);

    if (updateError) throw updateError;

    // Creer une notification pour le destinataire
    await supabase.from("notifications").insert({
      user_id: user.id,
      titre: "Nouvelle tache assignee",
      message: `Une tache vous a ete assignee: ${tache.titre}`,
      type: "tache",
    });

    toast.success(`Tache assignee a ${user.nom}`);
    setUserSelectorOpen(false);
    onOpenChange(false);
  } catch (error) {
    console.error("Error assigning task:", error);
    toast.error("Erreur lors de l'assignation");
  } finally {
    setIsAssigning(false);
  }
};
```

### Imports a nettoyer

**Supprimer:**
- `Send` de lucide-react
- `Input` de ui/input
- `formatDistanceToNow` de date-fns
- `useTacheMessages` hook
- `QuickTaskDialog` import

**Ajouter:**
- `toast` de sonner (pour les notifications UI)

### Resume des changements

| Element | Avant | Apres |
|---------|-------|-------|
| Zone messagerie | Presente | Supprimee |
| Input message | Present | Supprime |
| QuickTaskDialog | Utilise | Supprime |
| Bouton Assigner | Ouvre QuickTaskDialog | Assigne directement la tache |
| Comportement | Cree nouvelle tache | Met a jour la tache existante |

### Ce qui ne sera PAS modifie

- Le dashboard
- Les autres pages
- Le DirectMessagePanel
- La page Taches (sauf le comportement du dialog)
- Les autres dialogs

