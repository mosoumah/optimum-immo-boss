
## Probleme identifie

La page "Gestion des utilisateurs" ne montre que l'admin connecte parce que la politique RLS sur la table `profiles` est trop restrictive:

```sql
"Users can view their own profile" → USING (id = auth.uid())
```

Cette regle empeche de voir les profils des autres utilisateurs de la meme entreprise.

Meme situation pour `user_roles`:
```sql
"Users can view their own roles" → USING (user_id = auth.uid())
```

## Solution

Modifier les politiques RLS pour permettre aux admins de voir tous les utilisateurs de leur entreprise.

### Migration SQL a appliquer

```text
┌────────────────────────────────────────────────────────────────────┐
│ Table: profiles                                                    │
├────────────────────────────────────────────────────────────────────┤
│ AVANT: "Users can view their own profile"                         │
│        USING (id = auth.uid())                                     │
│                                                                    │
│ APRES: "Users can view profiles in their entreprise"              │
│        USING (                                                     │
│          id = auth.uid()                                           │
│          OR                                                        │
│          (entreprise_id = get_user_entreprise_id(auth.uid())       │
│           AND has_role(auth.uid(), 'admin'))                       │
│        )                                                           │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│ Table: user_roles                                                  │
├────────────────────────────────────────────────────────────────────┤
│ AVANT: "Users can view their own roles"                            │
│        USING (user_id = auth.uid())                                │
│                                                                    │
│ APRES: "Admins can view roles in their entreprise"                 │
│        USING (                                                     │
│          user_id = auth.uid()                                      │
│          OR                                                        │
│          (EXISTS(SELECT 1 FROM profiles p                          │
│                  WHERE p.id = user_id                              │
│                  AND p.entreprise_id =                             │
│                      get_user_entreprise_id(auth.uid()))           │
│           AND has_role(auth.uid(), 'admin'))                       │
│        )                                                           │
└────────────────────────────────────────────────────────────────────┘
```

### Fichiers concernes

| Fichier | Action |
|---------|--------|
| Nouvelle migration SQL | Creer pour modifier les politiques RLS |
| `src/pages/Utilisateurs.tsx` | Aucune modification necessaire (la logique est deja correcte) |

### Verification apres implementation

1. L'admin connecte peut voir tous les utilisateurs de son entreprise
2. Les agents ne peuvent toujours voir que leur propre profil
3. Les nouveaux utilisateurs crees apparaissent immediatement dans le tableau

### Securite

- Les admins ne peuvent voir que les utilisateurs de **leur propre entreprise**
- Les agents et clients ne peuvent toujours voir que leur propre profil
- Aucune fuite de donnees entre entreprises
