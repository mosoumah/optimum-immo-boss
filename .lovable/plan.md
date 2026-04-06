
# Correction ciblée — boucle de connexion / retour au formulaire

## Diagnostic retenu
Le problème le plus probable est un **race condition dans `AuthProvider`** :

- `onAuthStateChange(...)` met bien l’utilisateur en session après le login
- mais le `getSession()` lancé juste après au montage peut revenir avec un **ancien état `null`**
- ce résultat tardif réécrit `user/session` à `null`
- les routes protégées voient alors “non authentifié” et renvoient vers `/connexion`

Les indices vont dans ce sens :
- les RPC `get_user_role` et `get_user_entreprise_id` répondent correctement
- le dashboard semble commencer à charger
- puis l’application retombe sur la page de connexion

## Plan d’implémentation

### 1. Fiabiliser l’initialisation auth dans `src/hooks/useAuth.tsx`
Remplacer la logique actuelle par une version anti-race :

- centraliser la mise à jour `session/user/loading` dans une seule fonction
- utiliser un `ref` du type `hasResolvedInitialAuth`
- laisser **le premier résultat valide** (`INITIAL_SESSION` ou `getSession`) initialiser l’état
- empêcher un `getSession()` tardif d’écraser un état déjà mis à jour par `SIGNED_IN`
- conserver l’écoute `onAuthStateChange` pour les changements futurs
- ne plus faire de double écrasement concurrent sur `user`

Objectif : après un login réussi, la session ne peut plus repasser à `null` à cause d’un retour asynchrone ancien.

### 2. Verrouiller le comportement de chargement auth
Toujours dans `useAuth.tsx` :

- garder `loading=true` tant que l’état initial n’est pas résolu proprement
- éviter qu’une route protégée interprète trop tôt l’utilisateur comme “déconnecté”

Objectif : supprimer les redirections prématurées vers `/connexion`.

### 3. Garder `Connexion.tsx` simple et non destructive
Dans `src/pages/Connexion.tsx` :

- conserver un seul flux de redirection
- ne naviguer vers `/dashboard` qu’après disponibilité stable de `user`
- ne réinitialiser le verrou de redirection qu’en cas de vrai échec
- ne pas ajouter d’autre logique de session ici

Objectif : la page de connexion reste un point d’entrée, pas un second gestionnaire d’état auth.

### 4. Durcir les écrans qui lisent le profil utilisateur
Dans :
- `src/pages/Dashboard.tsx`
- `src/pages/Parametres.tsx`

Adapter les chargements dépendants du profil pour qu’ils ne deviennent pas bloquants pendant la restauration de session :

- ne lancer les lectures qu’une fois l’auth réellement prête
- traiter explicitement le cas `profileData === null` sans casser le flux
- éviter qu’un écran donne l’impression d’une déconnexion alors qu’il s’agit d’un chargement incomplet

Objectif : supprimer les effets secondaires visibles après connexion.

## Fichiers impactés
- `src/hooks/useAuth.tsx` — correction principale
- `src/pages/Connexion.tsx` — stabilisation du flux de redirection
- `src/pages/Dashboard.tsx` — durcissement du chargement profil
- `src/pages/Parametres.tsx` — durcissement du chargement profil

## Résultat attendu
Après correction :

- un login valide garde bien la session active
- l’utilisateur arrive sur `/dashboard` sans rebond vers `/connexion`
- les routes protégées n’interprètent plus un état intermédiaire comme une déconnexion
- le problème est corrigé sans toucher au design ni aux autres modules
