

# Correction de toutes les erreurs et warnings de sécurité

## Findings actifs (5 à corriger)

### ERREURS (2)

**1. Realtime sans autorisation** (`realtime_messages_no_rls`)
Les tables `factures`, `revenus`, `depenses`, `reservations`, `direct_messages`, `tache_messages`, `notifications` sont publiées en Realtime mais n'importe quel utilisateur authentifié peut écouter n'importe quel canal.

**Correction :** Retirer les tables financières sensibles de la publication Realtime. Seules `direct_messages`, `tache_messages` et `notifications` ont un besoin réel de Realtime (messagerie et notifications). Les tables `factures`, `revenus`, `depenses`, `reservations` n'en ont pas besoin — les pages les rechargent déjà manuellement. Et pour les 3 tables restantes, le RLS existant filtre déjà les rows par `user_id` ou `entreprise_id`, ce qui protège les données au niveau des events Postgres Changes.

**2. Studio-IA delete sans restriction** (`studio_ia_delete_any_authenticated`)
N'importe quel utilisateur peut supprimer les fichiers de n'importe quelle agence dans le bucket `studio-ia`.

**Correction :** Remplacer les policies permissives par des policies scopées par `entreprise_id` dans le chemin du fichier (pattern `originals/{entreprise_id}/...`), identique au pattern utilisé pour le bucket `logos`.

### WARNINGS (3)

**3. User roles UPDATE manquant** (`user_roles_update_missing`)
Pas de policy UPDATE explicite → risque théorique d'escalade de privilèges.

**Correction :** Ajouter `CREATE POLICY ... FOR UPDATE ... USING (false)`.

**4. Entreprise email/phone exposés** (`entreprises_email_phone_exposed`)
Les utilisateurs avec rôle `client` peuvent voir l'email et le téléphone de l'agence.

**Action :** Ignorer ce finding — les utilisateurs `client` ne peuvent pas se connecter à l'application (ils sont bloqués au login). Les seuls utilisateurs qui accèdent à la table `entreprises` sont admin et agent, qui ont légitimement besoin de ces informations.

**5. Leaked password protection** (`SUPA_auth_leaked_password_protection`)
La vérification HIBP est désactivée.

**Correction :** Activer via l'outil `configure_auth`.

## Plan d'exécution

### Étape 1 — Migration SQL
Une seule migration pour :
- `ALTER PUBLICATION supabase_realtime DROP TABLE` pour `factures`, `revenus`, `depenses`, `reservations`
- Remplacer les policies storage `studio-ia` (INSERT, DELETE) par des policies scopées par entreprise_id dans le chemin
- Ajouter `CREATE POLICY "User roles update denied" ON user_roles FOR UPDATE USING (false)`

### Étape 2 — Activer HIBP
Utiliser `configure_auth` pour activer la protection contre les mots de passe compromis.

### Étape 3 — Marquer les findings résolus
Mettre à jour le statut des findings corrigés et ignorer le finding `entreprises_email_phone_exposed` avec justification.

## Fichiers impactés
- 1 migration SQL
- Configuration auth (HIBP)

## Ce qui ne change PAS
- Aucun changement de design
- Aucun changement de code frontend
- Aucun changement aux autres modules
- La messagerie et les notifications en temps réel continuent de fonctionner

