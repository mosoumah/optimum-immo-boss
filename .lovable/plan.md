

# Suppression de l'acces client a l'application

## Objectif
Retirer completement la possibilite pour les utilisateurs avec le role "client" de se connecter et d'acceder a l'application. Seuls les roles **Administrateur** et **Utilisateur (agent)** pourront se connecter. La gestion des clients (ajout, modification, suppression dans le tableau de bord) reste intacte.

## Modifications prevues

### 1. Bloquer la connexion des clients
**Fichier** : `src/pages/Connexion.tsx`
- Apres authentification, si le role est "client", afficher un message d'erreur "Acces refuse" et deconnecter l'utilisateur automatiquement.
- Supprimer la redirection vers `/portail-client`.
- Meme chose dans le `useEffect` de redirection automatique.

### 2. Bloquer dans RoleProtectedRoute
**Fichier** : `src/components/RoleProtectedRoute.tsx`
- Supprimer la logique de redirection vers `/portail-client` pour les clients (ligne qui redirige les clients vers leur portail).

### 3. Supprimer la route du portail client
**Fichier** : `src/App.tsx`
- Retirer la route `/portail-client` et son import.

### 4. Supprimer la page PortailClient
**Fichier** : `src/pages/PortailClient.tsx`
- Supprimer ce fichier (il ne sera plus utilise).

### 5. Nettoyer la page Utilisateurs
**Fichier** : `src/pages/Utilisateurs.tsx`
- Retirer l'option "Client" du selecteur de role lors de la creation d'un utilisateur.
- Retirer la carte de statistiques "Clients" (le compteur de comptes client).
- Retirer la logique de selection de client (`selectedClientId`, validation client, champs de liaison client).
- Renommer "Agent" en "Utilisateur" dans les labels affiches.

### 6. Nettoyer le hook useUserRole
**Fichier** : `src/hooks/useUserRole.tsx`
- Retirer la logique `clientId` et `client_accounts` (plus besoin de recuperer le client_id).
- Retirer `isClient` du retour.

### 7. Nettoyer la sidebar
**Fichier** : `src/components/DynamicSidebar.tsx`
- Retirer "client" des tableaux `roles` de chaque item de navigation (nettoyage).

### 8. Renommer les labels de role
Dans tous les fichiers concernes, renommer :
- "Agent" → "Utilisateur"
- "admin" reste "Administrateur"
- Supprimer toute reference au role "client" dans l'UI

## Ce qui ne change PAS
- La table `clients` dans la base de donnees (gestion des clients CRUD).
- Les pages Clients, ClientDetail dans le dashboard.
- Les RLS policies existantes (elles resteront mais le role "client" ne pourra plus se connecter).
- L'enum `app_role` en base de donnees (pas de migration necessaire, le blocage est cote applicatif).

