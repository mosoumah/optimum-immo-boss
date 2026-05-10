## Objectif

Permettre la suppression des **tâches** et des **devis** depuis leurs listes respectives, en suivant exactement le même schéma UI/sécurité que la suppression de factures.

## Changements

### 1. Permissions (migration SQL)
- `supprimer_devis` existe déjà dans l'enum `app_permission` → rien à créer.
- `supprimer_tache` n'existe pas → ajouter la valeur à l'enum `app_permission`.
- Insérer `(admin, supprimer_tache)` et `(admin, supprimer_devis)` dans `role_permissions` si manquants (admin uniquement, comme pour `supprimer_facture`).

### 2. `src/pages/Devis.tsx`
- Ajouter `Trash2` dans les imports lucide.
- Ajouter les imports `AlertDialog*` (Trigger, Content, Header, Title, Description, Footer, Cancel, Action).
- Ajouter une fonction `supprimerDevis(devis)` :
  - Vérifie `checkPermission("supprimer_devis")`.
  - `supabase.from("devis").delete().eq("id", devis.id)`.
  - Toast succès/erreur, puis `fetchDevis()`.
- Dans la ligne de chaque devis, ajouter un bouton `Trash2` rouge entouré d'un `AlertDialog` de confirmation, le tout dans `<PermissionGate permission="supprimer_devis">`. Texte : « Supprimer ce devis ? Cette action est irréversible. »

### 3. `src/pages/Taches.tsx`
- Ajouter `Trash2` dans les imports lucide + imports `AlertDialog*`.
- Ajouter une fonction `supprimerTache(tache)` :
  - Vérifie `checkPermission("supprimer_tache")`.
  - `supabase.from("taches").delete().eq("id", tache.id)`.
  - Toast + mise à jour locale (`setTaches(...)`) ou `fetchTaches()`.
- Dans la liste des tâches, ajouter un bouton `Trash2` (avec `e.stopPropagation()` pour ne pas ouvrir le détail) protégé par `<PermissionGate permission="supprimer_tache">` avec un `AlertDialog` de confirmation : « Supprimer cette tâche ? Cette action est irréversible. »

### 4. (Optionnel) Page Gestion des permissions
- Si `src/pages/GestionPermissions.tsx` liste les permissions par libellé, ajouter le label « Supprimer une tâche » pour `supprimer_tache`. À vérifier rapidement lors de l'implémentation.

## Hors périmètre

- Aucun changement sur dashboard, réservations, revenus, notifications, factures, chatbot.
- Aucun changement de RLS (les RLS actuelles permettent déjà aux admins de supprimer devis et tâches dans leur entreprise).

## Validation

- Build OK.
- En tant qu'admin : icône poubelle visible sur chaque devis et chaque tâche, confirmation, suppression effective.
- En tant qu'utilisateur sans la permission : icône non rendue (PermissionGate).
