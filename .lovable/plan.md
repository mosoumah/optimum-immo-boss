
# Plan de correction ciblée — Architecture relationnelle (sans toucher UI/Dashboard)

## Périmètre verrouillé
- Modifications uniquement backend (DB + fonction `chat-assistant`).
- Aucun changement UI.
- Aucun changement Dashboard.
- Aucun changement des autres modules hors demandes 1→4.

## 1) Fusion des triggers facture en un seul `handle_facture_paid_global`
### Actions
1. Créer une nouvelle fonction SQL `public.handle_facture_paid_global()` :
   - Si `NEW.statut = 'paye'` et changement réel de statut :
     - insérer un revenu (anti-duplication via `NOT EXISTS` sur `revenus.facture_id`)
     - mettre à jour `reservations.montant_paye = reservations.montant_total` si `NEW.reservation_id IS NOT NULL`
2. Supprimer les anciens triggers (si existants) :
   - `on_facture_paid`
   - `on_facture_paid_sync_reservation`
3. Créer un seul trigger :
   - `on_facture_paid_global AFTER UPDATE ON factures FOR EACH ROW EXECUTE FUNCTION handle_facture_paid_global()`

### Résultat attendu
- Une seule exécution métier à chaque paiement de facture.
- Plus de double logique concurrente entre revenus et sync réservation.

---

## 2) Automatisation des réservations expirées (horaire)
### Paramètres validés
- Fréquence: **toutes les heures**
- Statut à auto-clôturer: **`en_cours` uniquement**

### Actions
1. Faire évoluer `public.auto_complete_reservations(_entreprise_id uuid)` :
   - condition temporelle : `date_depart < now()`
   - scope statut : `statut = 'en_cours'`
   - actions :
     - `reservations.statut = 'terminee'`
     - libération du bien lié (`properties.statut = 'disponible'`) si aucune autre réservation active
2. Ajouter une fonction wrapper globale :
   - `public.auto_complete_reservations_all()` qui boucle sur les entreprises et appelle `auto_complete_reservations`.
3. Planifier l’exécution horaire via `pg_cron` (job SQL) :
   - exécution de `SELECT public.auto_complete_reservations_all();`
   - job idempotent (unschedule + schedule pour éviter doublons)

### Résultat attendu
- Clôture automatique sans action manuelle.
- Cohérence continue entre `reservations` et `properties`.

---

## 3) Limiter strictement le chatbot aux vues financières
### Fichier impacté
- `supabase/functions/chat-assistant/index.ts`

### Actions
1. Réduire `tools` à **un seul outil** :
   - `analyze_finances`
2. Nettoyer `executeTool()` :
   - conserver uniquement le case `analyze_finances`
   - supprimer les cases qui lisent/écrivent directement `clients`, `factures`, `reservations`, `properties`, `taches`, `devis`
3. Ajuster le system prompt :
   - préciser que l’assistant est limité à l’analyse financière issue des vues dashboard.
4. Conserver l’auth/JWT et le filtrage `entreprise_id` existants.

### Résultat attendu
- Suppression d’accès table direct depuis le chatbot.
- Coût/latence réduits, surface d’erreur plus faible.

---

## 4) Relations financières flexibles (revenus/factures)
### État actuel confirmé
- `factures.reservation_id` est déjà nullable → conforme, pas de rupture.
- `revenus` n’a pas encore `source_type` ni `reservation_id`.

### Actions (migration)
1. Ajouter à `revenus` :
   - `source_type text not null default 'manuel'` (valeurs métier: `facture`, `manuel`)
   - `reservation_id uuid null` (référence `reservations(id)` en `ON DELETE SET NULL`)
2. Backfill des lignes existantes :
   - `source_type = 'facture'` si `facture_id IS NOT NULL`
   - sinon `source_type = 'manuel'`
3. Adapter `handle_facture_paid_global` :
   - insertion revenus avec `source_type = 'facture'`
   - renseigner `reservation_id = NEW.reservation_id` si présent
4. Ne rien changer côté UI (compatibilité assurée par défaut `source_type='manuel'`).

### Résultat attendu
- Revenus manuels indépendants + revenus liés facture/réservation.
- Modèle prêt pour location + vente + revenus libres.

---

## 5) Validation ciblée (sans toucher les autres modules)
1. Test DB :
   - passer une facture `non_paye -> paye` avec/sans `reservation_id`
   - vérifier :
     - un seul revenu créé
     - `reservation.montant_paye` mis à jour si liée
2. Test auto-clôture :
   - créer une réservation `en_cours` expirée
   - vérifier après passage du job horaire :
     - réservation `terminee`
     - bien `disponible` si aucune autre active
3. Test chatbot :
   - requête “liste clients” doit refuser/pivoter
   - requête “analyse bénéfice mois” doit répondre depuis `v_dashboard_simple` / `v_dashboard_advanced_finance`

---

## Livrables prévus
- 1 migration SQL de consolidation (triggers + colonnes + fonctions + cron