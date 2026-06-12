## Problème

Lorsqu'un admin ajoute un utilisateur depuis la page Utilisateurs :
- L'edge function `admin-create-user` appelle bien `inviteUserByEmail`, donc un email d'invitation par défaut Lovable est censé partir.
- Mais le lien d'invitation redirige vers `/connexion`, qui demande un mot de passe que l'invité n'a jamais défini → l'utilisateur ne peut pas accéder au tableau de bord.
- De plus, la page `/reset-password` n'accepte que l'événement `PASSWORD_RECOVERY`, pas `INVITE` / `SIGNED_IN` issu d'un lien d'invitation, donc même en redirigeant manuellement, le formulaire affiche "Lien invalide".

## Solution

Garder les emails par défaut Lovable (aucune config domaine nécessaire) et corriger le flux post-clic.

### 1. Edge function `admin-create-user`
- Changer `redirectTo` de `${appUrl}/connexion` vers `${appUrl}/accept-invitation`.
- Conserver le reste de la logique (création profil, rôle, entreprise_id).

### 2. Nouvelle page `/accept-invitation` (`src/pages/AcceptInvitation.tsx`)
- Détecter la session créée par le lien d'invitation (`onAuthStateChange` event `SIGNED_IN` ou `INVITE`, et lecture du hash `type=invite`).
- Afficher un écran de bienvenue avec le nom de l'entreprise et un formulaire "Définir votre mot de passe" (champ + confirmation, min 6 caractères).
- À la soumission : `supabase.auth.updateUser({ password })`, puis redirection vers `/dashboard`.
- Si la session est absente / le lien expiré : message clair + bouton vers `/connexion`.

### 3. Routing
- Ajouter la route `/accept-invitation` dans `src/App.tsx` (publique, hors `ProtectedRoute`).

### 4. UI Utilisateurs
- Mettre à jour le toast de succès après création pour préciser : "Un email d'invitation a été envoyé à {email}. Il pourra définir son mot de passe et accéder au tableau de bord."

## Hors-périmètre

- Pas de configuration de domaine email custom (utilisation des emails Lovable par défaut).
- Pas de modification du template d'email (template Lovable standard utilisé).
- Pas de changement des permissions ni de la structure des rôles.

## Détails techniques

- L'invitation Supabase génère un lien qui établit automatiquement une session quand l'utilisateur clique. C'est pour ça que la nouvelle page peut directement appeler `updateUser({ password })`.
- `appUrl` côté edge function reste basé sur `APP_URL` env ou fallback existant.
