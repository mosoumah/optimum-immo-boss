
## Objectif

Remplacer le flux actuel d'invitation par email par une création directe de compte : l'admin saisit nom, email, mot de passe et rôle. Le compte est créé immédiatement (email confirmé), l'email est stocké en BDD, et l'utilisateur peut se connecter directement sur `https://lightslategray-cassowary-834123.hostingersite.com/`.

## Changements

### 1. Edge Function `admin-create-user` (refonte)

Fichier : `supabase/functions/admin-create-user/index.ts`

- Accepter un nouveau champ `password` (requis, min 8 caractères) dans le body.
- Retirer `role: 'client'` des rôles autorisés (le projet n'utilise que `admin` / `agent`).
- Remplacer `supabaseAdmin.auth.admin.inviteUserByEmail(...)` par :
  ```
  supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nom, entreprise_nom: '' },
  })
  ```
- Aucun email n'est envoyé. L'utilisateur peut se connecter immédiatement avec email + mot de passe.
- Conserver la logique existante : update profile (`entreprise_id`, `nom`, `email`), supprimer rôle auto-créé, insérer le bon rôle.
- Supprimer toute référence à `APP_URL` / `redirectTo` / `accept-invitation`.

### 2. Formulaire UI `src/pages/Utilisateurs.tsx`

- Ajouter un champ `Mot de passe *` (input `type="password"`, min 8 caractères) avec bouton afficher/masquer.
- Ajouter validation : email valide, nom ≥ 2 caractères, mot de passe ≥ 8 caractères.
- Mettre à jour `handleCreateUser` pour envoyer `password` à l'edge function.
- Remplacer le texte « L'utilisateur recevra un email pour définir son mot de passe » par « L'utilisateur pourra se connecter immédiatement avec cet email et ce mot de passe ».
- Changer le titre du dialog : « Inviter un utilisateur » → « Créer un utilisateur ».
- Changer le bouton : « Envoyer l'invitation » → « Créer l'utilisateur ».
- Mettre à jour le toast de succès : « Compte créé. {nom} peut se connecter avec son email et mot de passe. ».
- Réinitialiser le champ `password` après création.

### 3. Redirection vers le site Hostinger

Cible : tous les liens email qui pointent encore vers le domaine Lovable doivent pointer vers `https://lightslategray-cassowary-834123.hostingersite.com/`.

Comme le nouveau flux ne génère plus d'email d'invitation, seul reste le reset password :

- `src/pages/Connexion.tsx` (lien « Mot de passe oublié ») : forcer
  ```
  redirectTo: 'https://lightslategray-cassowary-834123.hostingersite.com/reset-password'
  ```
  au lieu de `${window.location.origin}/reset-password`.
- `src/hooks/useAuth.tsx` (`signUp` → `emailRedirectTo`) : remplacer `${window.location.origin}/` par l'URL Hostinger (au cas où un signup public reste utilisé).
- Vérifier `src/pages/ResetPassword.tsx` et autres pages auth pour tout `window.location.origin` utilisé en redirection email, et le remplacer par l'URL Hostinger.

Note : l'edge function `admin-create-user` n'enverra plus d'email, donc plus besoin de `APP_URL`.

### 4. Sécurité

- Validation `password` côté edge function (longueur min 8, max 72, type string).
- Validation côté UI avant envoi.
- Aucune fuite du mot de passe en logs (`console.log` ne doit pas inclure le body brut).

## Hors scope

- Pas de modification des permissions ni du système de rôles.
- Pas de modification des autres pages.
- Pas de changement de la page `AcceptInvitation` (devient inutile mais laissée en place pour ne rien casser ; suppression possible plus tard si confirmé).
