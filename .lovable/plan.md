
## Diagnostic retenu

Le problème ne vient ni de l’email/mot de passe, ni du rôle utilisateur.

Les indices sont clairs :
- les RPC `get_user_role` et `get_user_entreprise_id` répondent bien (`admin` + entreprise trouvée)
- en revanche, les requêtes vers `profiles` partent encore comme **anonymes** juste après connexion
- les logs auth montrent une **tempête de refresh token** avec `429 Request rate limit reached`
- `useAuth.tsx` considère actuellement **n’importe quel premier event auth** comme définitif, y compris un `INITIAL_SESSION` trop tôt / `null`

Résultat : l’application croit être connectée côté React pendant qu’une partie des requêtes backend part encore sans vraie session stabilisée, puis la route protégée retombe sur `/connexion`.

## Plan de correction définitive

### 1. Refaire proprement l’initialisation auth dans `src/hooks/useAuth.tsx`
- ne plus valider l’état initial sur “n’importe quel event”
- enregistrer `onAuthStateChange` d’abord
- lancer ensuite une initialisation explicite via `getSession()`
- ne considérer comme état final initial que :
  - le résultat de `getSession()`
  - ou un vrai event `SIGNED_IN` / `SIGNED_OUT` / `TOKEN_REFRESHED`
- empêcher qu’un état `null` précoce ou tardif écrase une session valide

Objectif : supprimer la course critique qui laisse partir des requêtes anonymes après connexion.

### 2. Stabiliser la redirection de `src/pages/Connexion.tsx`
- ne rediriger vers `/dashboard` qu’une fois la session réellement prête
- baser la redirection sur un état auth stabilisé, pas seulement sur `user`
- garder un seul flux de redirection
- éviter toute nouvelle boucle ou double tentative

Objectif : empêcher le rebond login → dashboard → login.

### 3. Supprimer la dépendance fragile aux lectures directes de `profiles` au démarrage
Le réseau montre que les lectures directes de `profiles` sont la zone fragile.

Je prévois de :
- créer une fonction backend sécurisée du type `get_current_user_context()` (basée sur `auth.uid()`, sans `_user_id` passé depuis le client)
- y récupérer `nom`, `email`, `entreprise_id`, éventuellement `role`
- remplacer les lectures directes de `profiles` dans :
  - `src/pages/Dashboard.tsx`
  - `src/pages/Parametres.tsx`
  - `src/pages/ProfilEntreprise.tsx`

Objectif : fiabiliser le post-login immédiat et ne plus dépendre d’une requête RLS sensible au timing.

### 4. Réduire les appels redondants qui aggravent l’instabilité
Aujourd’hui plusieurs hooks/pages redemandent très vite rôle + entreprise au montage.

Je vais :
- centraliser davantage le contexte utilisateur connecté
- éviter les appels simultanés inutiles au premier rendu
- conserver les hooks existants, mais les faire dépendre d’un état auth déjà prêt

Objectif : éliminer la tempête de requêtes et réduire le risque de 429 côté auth.

## Fichiers impactés
- `src/hooks/useAuth.tsx`
- `src/pages/Connexion.tsx`
- `src/pages/Dashboard.tsx`
- `src/pages/Parametres.tsx`
- `src/pages/ProfilEntreprise.tsx`
- 1 migration SQL pour une fonction backend sécurisée de contexte utilisateur

## Résultat attendu
Après cette correction :
- la session se stabilise correctement après connexion
- les requêtes protégées ne partent plus en mode anonyme
- l’utilisateur reste sur `/dashboard`
- la boucle de retour vers `/connexion` disparaît durablement
- on corrige aussi la fragilité structurelle actuelle, pas seulement le symptôme
