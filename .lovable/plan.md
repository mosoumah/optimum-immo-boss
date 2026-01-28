

## Plan: Corriger la création et suppression d'utilisateurs

### Problèmes identifiés

1. **Email de confirmation non envoyé**: Dans l'edge function actuelle, `email_confirm: true` confirme automatiquement l'email. L'utilisateur ne reçoit jamais d'email.

2. **Suppression impossible**: Le bouton "Supprimer" n'a aucune action associée (`onClick` manquant), et il n'existe pas d'edge function pour supprimer les utilisateurs.

### Solution proposée

#### Partie 1: Envoyer un email d'invitation

Modifier l'edge function `admin-create-user` pour utiliser `inviteUserByEmail` au lieu de `createUser`. Cette méthode :
- Crée le compte utilisateur
- Envoie automatiquement un email d'invitation
- L'utilisateur clique sur le lien et définit son mot de passe
- Il est redirigé vers le dashboard

| Changement | Avant | Après |
|------------|-------|-------|
| Méthode | `auth.admin.createUser()` | `auth.admin.inviteUserByEmail()` |
| Mot de passe | Défini par l'admin | Défini par l'utilisateur via l'email |
| Email | Confirmé automatiquement | Envoyé automatiquement |

#### Partie 2: Créer la suppression d'utilisateurs

1. **Nouvelle edge function** `admin-delete-user`:
   - Vérifie que l'appelant est admin
   - Vérifie que l'utilisateur appartient à la même entreprise
   - Supprime l'utilisateur via `auth.admin.deleteUser()`
   - Les cascades suppriment le profil, le rôle, etc.

2. **Handler dans Utilisateurs.tsx**:
   - Ajouter `handleDeleteUser(userId)` avec confirmation
   - Afficher un toast de succès
   - Rafraîchir la liste

### Fichiers à créer/modifier

| Fichier | Action |
|---------|--------|
| `supabase/functions/admin-create-user/index.ts` | Modifier pour utiliser `inviteUserByEmail` |
| `supabase/functions/admin-delete-user/index.ts` | Créer (nouvelle edge function) |
| `src/pages/Utilisateurs.tsx` | Ajouter handler de suppression + confirmation |

### Détails techniques

#### 1. Modification de admin-create-user

```typescript
// AVANT (ligne 127-135)
const { data: newUserData, error: createError } = await supabaseAdmin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { nom, entreprise_nom: '' },
})

// APRÈS
const redirectUrl = req.headers.get('origin') || 'https://votre-app.lovable.app'
const { data: newUserData, error: createError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
  data: { nom, entreprise_nom: '' },
  redirectTo: `${redirectUrl}/connexion`,
})
```

Note: Le mot de passe ne sera plus défini par l'admin, l'utilisateur le choisira lui-même via l'email.

#### 2. Nouvelle edge function admin-delete-user

```typescript
Deno.serve(async (req) => {
  // Vérifications similaires à admin-create-user
  // ...
  
  const { user_id } = await req.json()
  
  // Vérifier que l'utilisateur à supprimer est dans la même entreprise
  const { data: targetProfile } = await supabaseAdmin
    .from('profiles')
    .select('entreprise_id')
    .eq('id', user_id)
    .maybeSingle()
  
  if (targetProfile?.entreprise_id !== callerProfile.entreprise_id) {
    return error('forbidden')
  }
  
  // Supprimer l'utilisateur (les cascades font le reste)
  await supabaseAdmin.auth.admin.deleteUser(user_id)
  
  return success()
})
```

#### 3. Handler de suppression dans Utilisateurs.tsx

```typescript
const handleDeleteUser = async (userId: string) => {
  if (!confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) return
  
  const { error } = await supabase.functions.invoke("admin-delete-user", {
    body: { user_id: userId },
  })
  
  if (error) {
    toast({ title: "Erreur", description: error.message, variant: "destructive" })
    return
  }
  
  toast({ title: "Succès", description: "Utilisateur supprimé" })
  fetchData()
}

// Dans le JSX
<DropdownMenuItem onClick={() => handleDeleteUser(u.id)} className="text-destructive">
  <Trash2 className="w-4 h-4 mr-2" />
  Supprimer
</DropdownMenuItem>
```

### Impact sur le formulaire de création

Puisque le mot de passe sera défini par l'utilisateur via l'email:
- Retirer le champ "Mot de passe" du formulaire de création
- L'admin saisit seulement: Nom, Email, Rôle (et Client si rôle client)
- L'utilisateur reçoit un email avec un lien pour définir son mot de passe

### Flux utilisateur final

```
Admin                          Système                        Nouvel utilisateur
  │                               │                                    │
  ├─ Remplit nom, email, rôle ────►                                    │
  │                               ├─ Crée compte (sans mdp)            │
  │                               ├─ Envoie email d'invitation ────────►
  │                               │                                    │
  │                               │                       Clique le lien
  │                               │◄─────────────────────────────────────
  │                               │                                    │
  │                               ├─ Affiche page "définir mot de passe"
  │                               │                                    │
  │                               │            Définit son mot de passe
  │                               │◄─────────────────────────────────────
  │                               │                                    │
  │                               ├─ Redirige vers /connexion ou /dashboard
  │                               │                                    ▼
```

### Ce qui ne sera PAS modifié

- Le dashboard
- Les autres pages (Clients, Factures, etc.)
- La logique de rôles et permissions
- Le DirectMessagePanel
- Le TacheDetailDialog

