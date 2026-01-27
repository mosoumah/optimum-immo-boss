
Objectif
- Corriger l’écran noir “côté développeur” quand on clique sur Dashboard, et empêcher les boucles de redirection silencieuses.
- Rendre l’accès robuste même si un compte a un rôle manquant / un profil incomplet.

Constat (ce que j’ai trouvé)
- Dans les requêtes réseau, l’appel qui récupère le rôle renvoie une liste vide: `GET …/user_roles?select=role&user_id=eq.<votre_id>` → `[]`.
- Dans la base (environnement test), pour l’utilisateur actuellement connecté:
  - `public.user_roles` ne contient aucune ligne pour ce user → rôle = `null`.
  - `public.profiles.entreprise_id` est `NULL`.
- Conséquence:
  - `useUserRole()` renvoie `role=null`.
  - `RoleProtectedRoute` considère que l’utilisateur n’a pas le droit et “redirige” vers `/dashboard` (valeur par défaut). Si on est déjà sur `/dashboard`, ça crée une boucle/état incohérent qui ressemble à une page noire (rien d’utile ne s’affiche).
- Deuxième problème latent: la table `user_roles` permet théoriquement plusieurs rôles par user (`UNIQUE(user_id, role)`), alors que le front utilise `.maybeSingle()` (qui peut casser si plusieurs lignes existent). Même si ce n’est pas la cause principale ici, c’est une source d’écrans noirs futurs.

Approche de correction (sans “patch manuel” sur un seul utilisateur)
A) Ajouter une “auto-réparation” côté backend (Lovable Cloud)
1) Créer une fonction sécurisée `public.bootstrap_current_user()` (SECURITY DEFINER) qui s’exécute pour l’utilisateur connecté (`auth.uid()`), et qui garantit:
   - qu’il existe un profil `profiles` pour ce user (sinon création),
   - qu’il a une `entreprise_id` (si NULL → créer une entreprise et l’attacher au profil),
   - qu’il existe exactement un rôle dans `user_roles` pour ce user (si absent → en créer un; si multiple → normaliser).
2) Règle d’attribution de rôle (safe-by-default):
   - Si l’entreprise de l’utilisateur n’a aucun admin existant → lui donner `admin` (sinon l’entreprise serait “bloquée”).
   - Sinon → lui donner `agent` (moins de privilèges, donc plus sûr).
   - Cas particuliers:
     - Si on veut garder “client” à part: on ne force pas “client” automatiquement sans signal fort (sinon risque d’affectation erronée). On peut l’ajouter plus tard avec une règle explicite.

B) Solidifier le modèle `user_roles` (éviter les erreurs `.maybeSingle()`)
3) Migration SQL sur `public.user_roles`:
   - Ajouter `created_at timestamptz default now()` (utile pour diagnostic et tri).
   - Nettoyer les doublons (si un user a plusieurs rôles):
     - Stratégie: garder `admin` si présent, sinon `agent`, sinon `client`; supprimer le reste.
   - Remplacer la contrainte d’unicité:
     - Passer de `UNIQUE(user_id, role)` à `UNIQUE(user_id)` (car l’app attend un seul rôle).
   - Résultat: `useUserRole` ne tombera plus sur des erreurs “multiple rows”.

C) Corriger le front pour ne plus jamais “écran noir” en cas de rôle manquant
4) Modifier `src/hooks/useUserRole.tsx`
   - Ajouter une méthode `refetch()` retournée par le hook (pour pouvoir relire le rôle après bootstrap).
   - Modifier la requête pour être robuste:
     - soit garder `maybeSingle()` mais garanti par la DB (avec UNIQUE(user_id)),
     - soit, en plus, utiliser `.limit(1)` pour plus de sécurité.
   - En cas d’erreur: remonter un état d’erreur exploitable (ou au minimum un état “role=null mais fini de charger”).

5) Modifier `src/components/RoleProtectedRoute.tsx`
   - Nouveau comportement si `user` est connecté, `authLoading=false`, `roleLoading=false`, et `role` est `null`:
     1) Afficher un écran “Configuration du compte…” (spinner) au lieu de rediriger.
     2) Appeler une seule fois `supabase.rpc("bootstrap_current_user")`.
     3) Puis appeler `refetch()` (du hook `useUserRole`) pour récupérer le rôle fraîchement créé.
     4) Si après bootstrap le rôle est toujours absent → afficher un composant clair (ex: `PermissionDenied`) avec actions:
        - “Se déconnecter”
        - “Recharger”
        - éventuellement “Aller au profil entreprise” si pertinent
   - Corriger le piège de redirection:
     - Ne jamais rediriger vers `/dashboard` quand on est déjà sur `/dashboard` ET que le rôle est null.
     - Donc remplacer la logique “redirectTo='/dashboard'” par:
       - soit `redirectTo='/'`,
       - soit afficher `PermissionDenied` au lieu de rediriger pour les cas sans rôle.

6) Ajustements UI (scroll / hauteur)
   - Harmoniser les spinners “plein écran”:
     - Dans `Dashboard.tsx` et dans `RoleProtectedRoute.tsx`, remplacer `min-h-screen` par `h-screen overflow-hidden` pour éviter les pages qui deviennent scrollables juste à cause de l’écran de chargement.
   - Le Dashboard a déjà `h-screen overflow-hidden` sur le container principal; on s’assure que tous les états (loading, denied) respectent la même contrainte.

Fichiers concernés (code)
- Frontend:
  - `src/components/RoleProtectedRoute.tsx` (gérer rôle manquant sans boucle, bootstrap + UI)
  - `src/hooks/useUserRole.tsx` (refetch + robustesse)
  - `src/pages/Dashboard.tsx` (spinner plein écran cohérent, éventuellement try/catch + setIsLoading(false) garanti)
- Backend (migration):
  - Nouvelle migration SQL dans `supabase/migrations/…` pour:
    - fonction `public.bootstrap_current_user()`
    - normalisation + contraintes sur `public.user_roles`

Critères de validation (tests à faire après implémentation)
1) Avec le compte actuellement “bloqué”:
   - Aller sur `/dashboard` → au lieu de noir: “Configuration…” → puis dashboard s’affiche.
   - Vérifier que `profiles.entreprise_id` n’est plus NULL.
   - Vérifier qu’il y a exactement 1 ligne dans `user_roles` pour ce user.
2) Avec un compte admin normal:
   - Accès Dashboard OK, aucune régression.
3) Avec un compte agent:
   - Accès Dashboard OK, fonctionnalités limitées OK.
4) Tester dans l’onglet externe:
   - Dashboard ne doit pas créer de scroll global inattendu (seuls les blocs internes scrollent, ex: liste clients).

Notes importantes
- Cette correction vise la cause racine: “compte incomplet” (rôle/entreprise manquants), au lieu de masquer le symptôme.
- Le fallback UI évite qu’un problème de données se transforme en écran noir: l’utilisateur verra toujours un message et une action.

Si vous approuvez, je passe en implémentation et j’applique la migration + les modifications front.
