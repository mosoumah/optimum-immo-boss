
## Plan de correction - Création d'utilisateurs par l'admin

### Problemes identifies

1. **"User already registered"** : L'email existe deja dans la base de donnees. Le code actuel ne gere pas ce cas proprement.

2. **Session admin remplacee** : L'utilisation de `supabase.auth.signUp()` cote client cree automatiquement une session pour le nouvel utilisateur, ce qui deconnecte l'administrateur en cours.

### Solution proposee

Creer une **Edge Function** dediee qui utilise le **Service Role Key** pour creer les utilisateurs via `auth.admin.createUser()`. Cette methode:
- Ne change PAS la session de l'admin
- Permet de confirmer automatiquement l'email
- Gere mieux les erreurs (email deja utilise)

### Modifications a effectuer

#### 1. Nouvelle Edge Function : `supabase/functions/admin-create-user/index.ts`

Cette fonction backend securisee:
- Recoit les donnees du nouvel utilisateur (email, mot de passe, nom, role, entreprise_id, client_id optionnel)
- Verifie que l'appelant est un admin de la bonne entreprise (via le token JWT)
- Utilise `supabase.auth.admin.createUser()` avec le Service Role Key
- Configure le profil et le role atomiquement
- Retourne le resultat sans affecter la session de l'admin

```text
┌─────────────────────────────────────────────────────────────────┐
│                    FLUX DE CREATION                             │
├─────────────────────────────────────────────────────────────────┤
│  AVANT (problematique)                                          │
│  ──────────────────────                                         │
│  Admin → signUp() → Nouvelle session creee → Admin deconnecte   │
│                                                                 │
│  APRES (correction)                                             │
│  ────────────────────                                           │
│  Admin → Edge Function → admin.createUser() → Session intacte   │
│          (Service Role)                                         │
└─────────────────────────────────────────────────────────────────┘
```

#### 2. Modification : `src/pages/Utilisateurs.tsx`

Remplacer l'appel direct a `supabase.auth.signUp()` par un appel a la nouvelle Edge Function:

**AVANT:**
```typescript
const { data: authData, error: authError } = await supabase.auth.signUp({
  email: newUserEmail,
  password: newUserPassword,
  // ...
});
```

**APRES:**
```typescript
const { data, error } = await supabase.functions.invoke('admin-create-user', {
  body: {
    email: newUserEmail,
    password: newUserPassword,
    nom: newUserNom,
    role: newUserRole,
    entreprise_id: profileData.entreprise_id,
    client_id: newUserRole === 'client' ? selectedClientId : null,
  },
});
```

#### 3. Amelioration de la gestion des erreurs

Ajouter des messages d'erreur clairs en francais:
- "Cet email est deja utilise" si l'utilisateur existe
- "Mot de passe trop court (minimum 6 caracteres)" pour les mots de passe faibles
- "Vous n'avez pas les droits pour creer des utilisateurs" si pas admin

### Details techniques de l'Edge Function

```typescript
// Structure de la nouvelle Edge Function
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// 1. Extraire le JWT de l'appelant pour verifier qu'il est admin
// 2. Creer un client Supabase avec le Service Role Key
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
);

// 3. Creer l'utilisateur sans changer de session
const { data: userData, error } = await supabaseAdmin.auth.admin.createUser({
  email: email,
  password: password,
  email_confirm: true, // Confirmer automatiquement
  user_metadata: { nom: nom }
});

// 4. Configurer le profil et le role
await supabaseAdmin.from('profiles').update({...});
await supabaseAdmin.from('user_roles').insert({...});
```

### Fichiers concernes

| Fichier | Action |
|---------|--------|
| `supabase/functions/admin-create-user/index.ts` | Creer (nouvelle Edge Function) |
| `src/pages/Utilisateurs.tsx` | Modifier (utiliser la nouvelle fonction) |

### Securite

- La fonction verifie le JWT de l'appelant
- Seuls les admins peuvent creer des utilisateurs
- L'admin ne peut creer que dans son entreprise
- Le Service Role Key n'est jamais expose au client

### Tests de validation

1. Creer un agent → L'admin reste connecte
2. Creer un client → L'admin reste connecte
3. Tenter de creer avec un email existant → Message d'erreur clair
4. Verifier que le nouvel utilisateur peut se connecter
