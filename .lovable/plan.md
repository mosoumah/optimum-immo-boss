

# Audit de Sécurité et Stabilité — Optimum Immo

## Analyse complète par priorité

---

## Priorité 1 : Secrets et clés API
**Statut : OK**
- Tous les secrets (LOVABLE_API_KEY, SUPABASE_SERVICE_ROLE_KEY, etc.) sont stockés côté serveur dans les variables d'environnement Deno
- Aucun secret n'est exposé dans le code frontend
- Le fichier `.env` ne contient que des clés publiques (anon key, URL)

**Aucune action requise.**

---

## Priorité 2 : Isolation des données par agence
**Statut : OK**
- Toutes les tables métier ont des politiques RLS filtrant par `entreprise_id = get_user_entreprise_id(auth.uid())`
- Les Edge Functions `admin-create-user` et `admin-delete-user` vérifient que l'admin opère dans sa propre entreprise
- Le chatbot filtre par `entreprise_id` via RLS

**Aucune action requise.**

---

## Priorité 3 : Authentification et rôles
**Statut : OK**
- JWT validé dans toutes les Edge Functions (getClaims ou getUser)
- `RoleProtectedRoute` + `ProtectedRoute` côté frontend
- Rôle admin vérifié côté serveur dans les fonctions admin
- Login bloque le rôle `client`

**Aucune action requise.**

---

## Priorité 4 : Validation des données saisies
**Problèmes identifiés :**

### 4a. XSS dans ChatMessage.tsx (CRITIQUE)
Le `renderContent()` injecte le contenu IA via `dangerouslySetInnerHTML` sans sanitisation. Si l'IA retourne du HTML malveillant (ou si le contenu est manipulé), c'est un vecteur XSS.

**Correction :** Échapper le HTML du message AVANT d'appliquer les remplacements Markdown (bold, italic, code).

### 4b. Pas de validation des montants négatifs
Les dialogs `FactureDialog`, `RevenuDialog`, `DevisDialog`, `DepenseDialog`, `ReservationDialog` acceptent `parseFloat(montant)` sans vérifier que le montant est positif. Un montant négatif fausserait les calculs financiers.

**Correction :** Ajouter une validation `montant > 0` avant insertion dans tous les dialogs financiers.

### 4c. Pas de validation d'input dans les Edge Functions
`generate-document`, `generate-facture`, `generate-devis` acceptent `await req.json()` sans aucune validation de schéma. Des champs manquants ou malformés peuvent causer des erreurs silencieuses.

**Correction :** Ajouter une validation minimale des champs requis (présence + type) dans chaque Edge Function.

---

## Priorité 5 : Permissions sur actions sensibles
**Statut : Partiellement OK**
- `checkPermission()` est utilisé côté client pour les actions critiques (supprimer client, modifier facture, etc.)
- RLS enforce les permissions côté serveur

### 5a. Actions sans vérification de permission côté client
Les dialogs de création (FactureDialog, DevisDialog, RevenuDialog, DepenseDialog, ClientDialog, ReservationDialog) n'appellent PAS `checkPermission()` avant l'insertion. La protection repose uniquement sur `PermissionGate` (masquage UI) et RLS.

**Correction :** Ce n'est pas critique car RLS bloque l'opération côté serveur. Mais pour une meilleure UX, ajouter `checkPermission()` dans les dialogs clés — à faire dans une phase ultérieure si souhaité. **Pas bloquant.**

---

## Priorité 6 : Sécurité des fichiers (logos, signatures, PDFs)
**Statut : OK**
- Buckets `logos`, `studio-ia`, `property-covers` sont publics (voulu pour l'affichage)
- Les signatures sont stockées en Data URL dans `entreprises.signature` (protégé par RLS)
- Les PDFs sont générés côté client via `document.write()` avec `escapeHtml()` et `sanitizeHexColor()`

**Aucune action critique requise.**

---

## Priorité 7 : Messagerie et notifications
**Statut : OK**
- RLS sur `direct_messages` : sender_id = auth.uid() pour INSERT, entreprise isolée
- RLS sur `notifications` : user_id = auth.uid()
- RLS sur `tache_messages` : via `can_access_tache_messages()` (SECURITY DEFINER)

**Aucune action requise.**

---

## Priorité 8 : Automatisations financières
**Statut : OK (récemment corrigé)**
- `handle_facture_paid_global` utilise `CURRENT_DATE` et anti-duplication
- `handle_facture_deleted` cascade la suppression des revenus
- `auto_complete_reservations_all` planifié toutes les heures via pg_cron

**Aucune action requise.**

---

## Priorité 9 : Statistiques dashboard
**Statut : OK**
- Les vues `v_dashboard_simple` et `v_dashboard_advanced_finance` sont des vues SQL filtrées par `entreprise_id`
- Le chatbot n'accède qu'à ces vues via RLS

**Aucune action requise.**

---

## Priorité 10 : Protections globales (CORS, imports, anti-abus)
### 10a. Imports `esm.sh` dans 2 Edge Functions (MOYEN)
`admin-create-user` et `admin-delete-user` utilisent `https://esm.sh/@supabase/supabase-js@2` au lieu de `npm:@supabase/supabase-js@2`. Cela crée une dépendance sur un CDN tiers non contrôlé et peut causer des timeouts de déploiement.

**Correction :** Remplacer par `npm:@supabase/supabase-js@2`.

### 10b. CORS headers incomplets dans 2 Edge Functions (MOYEN)
`admin-create-user` et `admin-delete-user` ont des CORS headers minimalistes qui ne couvrent pas les headers Supabase récents (`x-supabase-client-platform`, etc.).

**Correction :** Aligner les CORS headers avec ceux des autres fonctions.

---

## Résumé des actions

| # | Problème | Criticité | Fichier |
|---|----------|-----------|---------|
| 1 | XSS dans ChatMessage via dangerouslySetInnerHTML | CRITIQUE | `src/components/chat/ChatMessage.tsx` |
| 2 | Montants négatifs acceptés dans les dialogs | MOYEN | 5 dialogs financiers |
| 3 | Pas de validation d'input dans Edge Functions | MOYEN | `generate-document`, `generate-facture`, `generate-devis` |
| 4 | Import esm.sh dans admin functions | MOYEN | `admin-create-user`, `admin-delete-user` |
| 5 | CORS headers incomplets | MOYEN | `admin-create-user`, `admin-delete-user` |

## Plan d'implémentation

### Étape 1 — Corriger XSS dans ChatMessage.tsx
Échapper le HTML brut du message avant d'appliquer les remplacements Markdown. Utiliser `escapeHtml` de `@/lib/escapeHtml` sur `text` en premier, puis appliquer les regex bold/italic/code.

### Étape 2 — Valider les montants dans les dialogs financiers
Ajouter `if (parseFloat(montant) <= 0)` avec toast d'erreur dans :
- `FactureDialog.tsx`
- `DevisDialog.tsx`
- `RevenuDialog.tsx`
- `DepenseDialog.tsx`
- `ReservationDialog.tsx` (pour `prix_unitaire`)

### Étape 3 — Valider les inputs dans les Edge Functions
Ajouter une validation des champs requis après `await req.json()` dans :
- `generate-document/index.ts` (vérifier `typeDocument`, `entrepriseNom`)
- `generate-facture/index.ts` (vérifier `montant`, `clientNom`, `entrepriseNom`)
- `generate-devis/index.ts` (vérifier `montant`, `clientNom`, `entrepriseNom`)

### Étape 4 — Migrer les imports et CORS dans admin functions
- Remplacer `https://esm.sh/@supabase/supabase-js@2` par `npm:@supabase/supabase-js@2`
- Aligner les CORS headers avec le standard complet
- Dans `admin-create-user/index.ts` et `admin-delete-user/index.ts`

### Fichiers impactés
- `src/components/chat/ChatMessage.tsx`
- `src/components/dialogs/FactureDialog.tsx`
- `src/components/dialogs/DevisDialog.tsx`
- `src/components/dialogs/RevenuDialog.tsx`
- `src/components/dialogs/DepenseDialog.tsx`
- `src/components/dialogs/ReservationDialog.tsx`
- `supabase/functions/generate-document/index.ts`
- `supabase/functions/generate-facture/index.ts`
- `supabase/functions/generate-devis/index.ts`
- `supabase/functions/admin-create-user/index.ts`
- `supabase/functions/admin-delete-user/index.ts`

### Ce qui ne change PAS
- Aucun changement de design
- Aucune nouvelle fonctionnalité
- Aucune migration SQL
- Aucun changement de structure de table

