
## Plan: Amelioration de la redirection apres connexion

### Situation actuelle

Les utilisateurs crees par l'admin (agents et clients) **peuvent deja se connecter** a l'application via `/connexion`. Cependant, la redirection post-connexion n'est pas optimisee:

- Tous les utilisateurs sont rediriges vers `/dashboard`
- Les clients sont ensuite re-rediriges vers `/portail-client` par le `RoleProtectedRoute`
- Cela cree un "flash" visuel et une experience utilisateur degradee

### Solution proposee

Modifier la page de connexion pour rediriger intelligemment chaque utilisateur vers l'interface appropriee selon son role:

| Role | Redirection |
|------|-------------|
| Admin | `/dashboard` |
| Agent | `/dashboard` |
| Client | `/portail-client` |

### Modifications a effectuer

#### 1. Modifier `src/pages/Connexion.tsx`

Apres une connexion reussie, recuperer le role de l'utilisateur et rediriger vers la bonne page.

```text
+----------------------------------------------------+
|               FLUX DE CONNEXION                    |
+----------------------------------------------------+
|  1. Utilisateur entre email + mot de passe         |
|  2. signIn() → authentification reussie            |
|  3. Recuperation du role via user_roles            |
|  4. Redirection intelligente:                      |
|     - admin/agent → /dashboard                     |
|     - client → /portail-client                     |
+----------------------------------------------------+
```

#### 2. Logique de redirection

```text
AVANT:
  Connexion → navigate("/dashboard") [toujours]
  
APRES:
  Connexion → Fetch role → navigate(role === "client" ? "/portail-client" : "/dashboard")
```

### Details techniques

1. **Apres `signIn()` reussi**: Attendre que le `onAuthStateChange` mette a jour l'utilisateur
2. **Recuperer le role**: Faire une requete sur `user_roles` pour obtenir le role
3. **Rediriger**: Utiliser `navigate()` vers la bonne destination

### Fichiers concernes

| Fichier | Action |
|---------|--------|
| `src/pages/Connexion.tsx` | Modifier (redirection intelligente basee sur le role) |

### Verification apres implementation

1. Un agent se connecte → arrive sur `/dashboard`
2. Un client se connecte → arrive sur `/portail-client`
3. Un admin se connecte → arrive sur `/dashboard`
4. Pas de "flash" ou redirection intermediaire visible

### Securite

- Le role est recupere depuis la base de donnees (pas de localStorage)
- Les pages restent protegees par `RoleProtectedRoute`
- Aucune fuite d'information possible

### Ce qui fonctionne deja

- Les agents peuvent voir les clients qui leur sont assignes
- Les clients peuvent voir leurs devis/factures
- Les permissions granulaires fonctionnent via `PermissionGate`
- L'admin peut personnaliser les droits de chaque utilisateur

