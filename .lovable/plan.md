

# Audit de Sécurité Backend - Failles Identifiées et Corrections

## Résumé des problèmes trouvés

L'analyse a révélé **8 failles de sécurité** classées par criticité.

---

## CRITIQUES (3)

### 1. Injection PostgREST dans chat-assistant (search_clients)
**Risque** : L'IA peut injecter du contenu arbitraire dans le filtre `.or()` via le paramètre `query` (ligne 222). Un prompt malveillant pourrait manipuler la requête.
```
query = query.or(`nom.ilike.%${args.query}%,email.ilike.%${args.query}%`);
```
**Correction** : Valider et assainir `args.query` en supprimant les caractères spéciaux PostgREST (`.`, `(`, `)`, `,`) avant injection dans le filtre.

### 2. Table `depenses` sans restriction de rôle
**Risque** : Les politiques RLS ne vérifient que `entreprise_id` sans vérifier le rôle. Un utilisateur avec le rôle `client` pourrait lire, insérer, modifier et supprimer toutes les dépenses.
**Correction** : Ajouter `get_user_role(auth.uid()) IN ('admin', 'agent')` à toutes les politiques de `depenses`.

### 3. Table `revenus` — SELECT et INSERT sans restriction de rôle
**Risque** : Mêmes failles que `depenses` pour la lecture et l'insertion. Seul DELETE est protégé par rôle.
**Correction** : Ajouter la vérification de rôle aux politiques SELECT et INSERT.

---

## IMPORTANTS (3)

### 4. Table `documents` sans restriction de rôle
**Risque** : Les 4 politiques (SELECT, INSERT, UPDATE, DELETE) ne vérifient que `entreprise_id`. Un client pourrait accéder aux documents d'autres clients de la même entreprise.
**Correction** : Remplacer par des politiques role-based comme sur `factures`.

### 5. Table `client_accounts` — pas de scope entreprise
**Risque** : Les politiques INSERT et DELETE vérifient uniquement le rôle `admin` sans vérifier l'entreprise. Un admin pourrait manipuler les comptes clients d'une autre entreprise.
**Correction** : Ajouter une jointure vers `clients` pour vérifier `clients.entreprise_id = get_user_entreprise_id(auth.uid())`.

### 6. Protection contre les mots de passe compromis désactivée
**Risque** : Les utilisateurs peuvent créer des comptes avec des mots de passe figurant dans des bases de données de fuites.
**Correction** : Activer la protection via `configure_auth`.

---

## MODÉRÉS (2)

### 7. Table `role_permissions` — lecture ouverte à tous
**Risque** : La politique SELECT utilise `USING (true)`, exposant la matrice complète des permissions à tous les utilisateurs authentifiés.
**Correction** : Restreindre aux utilisateurs de la même entreprise ou aux admins uniquement.

### 8. `studio-ia-generate` utilise `esm.sh` au lieu de `npm:`
**Risque** : Peut provoquer des erreurs de timeout lors du déploiement (conformément aux contraintes documentées).
**Correction** : Remplacer `import { createClient } from "https://esm.sh/@supabase/supabase-js@2"` par `import { createClient } from "npm:@supabase/supabase-js@2"`.

---

## Plan d'implémentation

### Etape 1 — Migrations SQL (6 politiques RLS à corriger)

Une migration SQL pour :
- Remplacer les 4 politiques de `depenses` avec vérification de rôle admin/agent
- Remplacer les politiques SELECT et INSERT de `revenus` avec vérification de rôle
- Remplacer les 4 politiques de `documents` avec vérification de rôle (role-based CASE)
- Corriger les politiques INSERT et DELETE de `client_accounts` pour inclure le scope entreprise
- Restreindre la politique SELECT de `role_permissions` aux utilisateurs authentifiés de la même entreprise

### Etape 2 — Corriger l'injection dans chat-assistant

Ajouter une fonction de sanitisation dans `supabase/functions/chat-assistant/index.ts` pour nettoyer les paramètres `query` avant utilisation dans `.or()`.

### Etape 3 — Corriger l'import dans studio-ia-generate

Remplacer `esm.sh` par `npm:` dans `supabase/functions/studio-ia-generate/index.ts`.

### Etape 4 — Activer la protection mots de passe compromis

Utiliser l'outil `configure_auth` pour activer `leaked_password_protection`.

### Fichiers impactés
- Migration SQL (nouvelles politiques RLS)
- `supabase/functions/chat-assistant/index.ts` — sanitisation des inputs
- `supabase/functions/studio-ia-generate/index.ts` — correction import

