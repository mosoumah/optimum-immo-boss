## Section Tarification & Abonnements — Optimum Immo

Ajouter une page tarification premium + toute la logique d'essai gratuit 14 jours et de blocage post-essai, **sans toucher** aux modules métier existants (clients, biens, réservations, factures, revenus, dépenses, chatbot, permissions).

---

### 1. Backend — Extension de la table `subscriptions` (migration additive)

La table `subscriptions` existe déjà. On ne la recrée pas, on l'étend :

- Ajouter colonnes : `trial_ends_at timestamptz`, `billing_cycle text` (`monthly` | `yearly`), `updated_at timestamptz`.
- Étendre les valeurs possibles de `plan` : `trial`, `starter`, `standard`, `pro` (texte libre, aucune contrainte cassée).
- Étendre `status` : `trial`, `active`, `expired`, `cancelled`.

**Provisionnement automatique de l'essai 14 jours :**
- Modifier UNIQUEMENT le trigger `handle_new_user` (ou équivalent d'inscription) déjà en place, pour insérer à la création d'entreprise :
  ```
  plan='trial', status='trial', start_date=now(), trial_ends_at=now()+14 days, end_date=now()+14 days
  ```
- Fonction SQL `SECURITY DEFINER` : `get_subscription_state(_entreprise_id)` retournant `{ plan, status, is_trial, days_left, is_active, is_expired, features }` — source unique de vérité côté client.
- Job `pg_cron` quotidien : passe `status='expired'` quand `end_date < now()` et crée une notification "Essai expiré" pour les admins.
- Notifications automatiques (via table `notifications` existante) : J-7, J-3, J-1, J-0. Job `pg_cron` quotidien qui insère les notifications correspondantes (idempotent via clé unique `entreprise_id + type + jour`).

Grants + RLS déjà en place sur `subscriptions`, on conserve.

---

### 2. Frontend — Nouvelle page `/tarifs`

Route publique + accessible depuis dashboard. Composants dans `src/pages/Tarifs.tsx` + `src/components/pricing/*` :

- **En-tête** : titre, sous-titre, CTA "Commencer gratuitement".
- **Switch Mensuel / Annuel 🔥** animé (Framer Motion), badge "Économisez 2 mois".
- **3 cartes forfaits** (Starter / Standard [populaire, plus grande] / Pro) avec prix GNF, features, CTA. Données dans `src/lib/pricing/plans.ts` (source unique, facile à étendre : promos, codes promo, nouvelles features).
- **Bandeau réassurance** 14 jours gratuits.
- **Section "Pourquoi Optimum Immo"** : 8 cartes icônes (Lucide).
- **FAQ** avec `Accordion` shadcn (8 questions fournies).
- **Pied de section** : logos moyens de paiement (Orange Money, MTN, Visa, Mastercard, Virement — SVG/texte stylé) + CTA final.

Design : cohérent charte (lime green, gradients, `card-premium`, `mesh-gradient`, `FloatingParticles`), responsive mobile/tablette/desktop, animations `framer-motion`.

Ajouter lien "Tarifs" dans `Navbar` et sidebar (`DynamicSidebar`).

---

### 3. Hook `useSubscription` — enrichissement

Étendre `src/hooks/useSubscription.tsx` pour exposer :
- `isTrial`, `trialDaysLeft`, `trialEndsAt`
- `isBlocked` (essai expiré + aucun plan payant actif)
- `canUse(feature)` — check features par plan (`ai_assistant`, `unlimited_factures`, `messaging`, etc.) défini dans `src/lib/pricing/features.ts`.

Basé sur la RPC `get_subscription_state` pour éviter la logique côté client dispersée.

---

### 4. Carte Essai sur le Dashboard

Nouveau composant `src/components/dashboard/TrialCard.tsx` :
- Visible uniquement si `isTrial`.
- 🎁 Essai gratuit, "Il vous reste X jours", barre de progression (`Progress` shadcn), bouton "Voir les abonnements" → `/tarifs`.
- Discret, intégré au layout dashboard existant sans modifier les autres blocs.

---

### 5. Blocage post-essai (non intrusif)

Nouveau composant `src/components/SubscriptionGate.tsx` (wrapper léger, style `PermissionGate` déjà existant) :
- Si `isBlocked`, remplace le contenu enfant par une carte "Votre essai est terminé — Choisissez un forfait" + CTA `/tarifs`.
- Appliqué uniquement autour des **boutons d'action de création** dans : `BienDialog` trigger, `ReservationDialog` trigger, `FactureDialog` trigger, `AIChatBot`.
- **Aucune modification** de la logique des dialogs eux-mêmes, ni des Edge Functions, ni des tables métier. Les données restent 100 % consultables.

Modal automatique "Essai terminé" affichée une fois par session sur le dashboard si `isBlocked`.

---

### 6. Page choix de forfait post-essai

Sur `/tarifs`, quand `isBlocked=true`, afficher un bandeau haut de page "Votre essai est terminé". Les CTA des cartes appellent une fonction `selectPlan(plan, cycle)` qui :
- Enregistre l'intention dans `subscriptions` (`plan`, `billing_cycle`, `status='pending_payment'`).
- Affiche une modale "Paiement à venir — contactez-nous / Orange Money / etc." (aucun Stripe conformément à la mémoire projet).

Le paiement effectif reste manuel comme aujourd'hui — le plan pose les rails pour l'ajouter plus tard sans refactor.

---

### Détails techniques

**Fichiers créés**
- `supabase/migrations/<ts>_subscriptions_trial.sql`
- `src/pages/Tarifs.tsx`
- `src/components/pricing/PlanCard.tsx`, `BillingToggle.tsx`, `ReassuranceBanner.tsx`, `WhyOptimum.tsx`, `PricingFAQ.tsx`, `PaymentMethodsStrip.tsx`
- `src/components/dashboard/TrialCard.tsx`
- `src/components/SubscriptionGate.tsx`
- `src/lib/pricing/plans.ts`, `src/lib/pricing/features.ts`

**Fichiers modifiés (minimal)**
- `src/App.tsx` — route `/tarifs`
- `src/hooks/useSubscription.tsx` — enrichissement via nouvelle RPC
- `src/pages/Dashboard.tsx` — insertion `<TrialCard />`
- `src/components/Navbar.tsx`, `src/components/DynamicSidebar.tsx` — lien "Tarifs"
- Wrappers `SubscriptionGate` autour des 4 CTA création (biens, réservations, factures, chatbot)

**Non modifié** : Edge Functions, tables métier, logique clients/biens/réservations/factures/revenus/dépenses/permissions/chatbot, RLS existant.

**Architecture évolutive** : ajout futur d'un plan / promo = édition de `plans.ts` + éventuelle colonne `promo_code` ; ajout d'une feature Premium = édition de `features.ts` + wrap `SubscriptionGate feature="x"`.
