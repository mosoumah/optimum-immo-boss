

# Remise à niveau du Chatbot ImmoPilot — Lecture multi-modules + Actions sécurisées

## Situation actuelle

Le chatbot ne dispose que d'un seul outil (`analyze_finances`) qui interroge uniquement les vues dashboard. Il refuse toute question sur les clients, biens, réservations, tâches, etc. Il faut le transformer en assistant immobilier complet tout en maintenant une sécurité stricte.

## Architecture proposée

Le chatbot backend (`chat-assistant/index.ts`) sera restructuré avec :
- **Récupération du rôle et des permissions** de l'utilisateur au démarrage de chaque requête
- **9 outils de lecture** + **2 outils d'écriture** conditionnés par les permissions
- **Injection des permissions dans le system prompt** pour que l'IA sache ce qu'elle peut/ne peut pas faire
- **Vérification serveur des permissions** avant chaque exécution d'outil d'écriture

### Outils planifiés

| Outil | Permission requise | Action |
|-------|-------------------|--------|
| `search_reservations` | `voir_reservation` | Lire réservations (arrivées/départs/en cours) |
| `search_properties` | `voir_bien` | Lire biens (disponibles, réservés, etc.) |
| `search_clients` | `voir_client` | Lire clients (nom, téléphone, email) |
| `search_devis` | `voir_devis` | Lire devis (statut, montant) |
| `search_factures` | `voir_facture` | Lire factures (payées, impayées) |
| `search_revenus` | `voir_revenus` | Lire revenus du mois |
| `search_depenses` | `voir_depenses` | Lire dépenses |
| `search_taches` | `voir_tache` | Lire tâches (statut, assignation) |
| `analyze_finances` | `voir_statistiques_globales` OU `voir_statistiques_personnelles` | Résumé dashboard |
| `create_facture` | `creer_facture` | Créer une facture (avec confirmation IA) |
| `create_reservation` | `creer_reservation` | Créer une réservation (avec confirmation IA) |

### Sécurité des outils

- Chaque outil de lecture filtre par `entreprise_id` (déjà garanti par le Supabase client avec JWT utilisateur + RLS)
- Pour les agents, les requêtes RLS limitent déjà la visibilité (ex: clients `assigned_to`, tâches `assigned_to`)
- Les outils d'écriture vérifient la permission via `supabase.rpc("has_permission")` avant insertion
- Les outils `search_*` utilisent des filtres paramétrés (pas de `.or()` avec input brut) pour éviter l'injection PostgREST
- Aucun outil pour ajouter revenu/dépense (interdit par les règles)
- Aucun outil pour modifier des documents

### Anti-injection de prompt

Le system prompt inclura des instructions explicites pour ignorer toute tentative de manipulation, et les entrées utilisateur passent par l'IA sans accès direct aux requêtes SQL.

## Plan d'implémentation

### Étape 1 — Réécrire `supabase/functions/chat-assistant/index.ts`

1. **Au démarrage de chaque requête**, après récupération du profil :
   - Récupérer le rôle via `supabase.rpc("get_user_role", { _user_id: userId })`
   - Récupérer les permissions via `supabase.rpc("get_user_permissions", { _user_id: userId })`
   - Bloquer si rôle = `client`

2. **Construire dynamiquement la liste d'outils** selon les permissions de l'utilisateur :
   - Si `voir_reservation` → inclure `search_reservations`
   - Si `voir_bien` → inclure `search_properties`
   - etc.
   - Si `creer_facture` → inclure `create_facture`
   - Si `creer_reservation` → inclure `create_reservation`

3. **Mettre à jour le system prompt** pour :
   - Lister explicitement les permissions actives
   - Indiquer le rôle (admin/agent)
   - Interdire explicitement : ajout revenu, ajout dépense, modification documents
   - Exiger confirmation avant toute action d'écriture
   - Inclure les règles anti-manipulation de prompt

4. **Implémenter les fonctions `executeTool`** :
   - `search_reservations` : `.from("reservations").select("id, client_id, property_name, date_arrivee, date_depart, statut, montant_total, montant_paye")` avec filtres optionnels (date, statut)
   - `search_properties` : `.from("properties").select(...)` avec filtre statut optionnel
   - `search_clients` : `.from("clients").select(...)` avec filtre nom via `.ilike("nom", "%query%")`
   - `search_devis` : `.from("devis").select(...)` avec filtre statut optionnel
   - `search_factures` : `.from("factures").select(...)` avec filtre statut optionnel
   - `search_revenus` : `.from("revenus").select(...)` filtrés par mois courant par défaut
   - `search_depenses` : `.from("depenses").select(...)` filtrés par mois courant
   - `search_taches` : `.from("taches").select(...)` avec filtre statut
   - `analyze_finances` : identique à l'actuel (vues dashboard)
   - `create_facture` : vérification `has_permission` + insertion
   - `create_reservation` : vérification `has_permission` + insertion

   Toutes les lectures passent par le Supabase client authentifié (RLS appliquée automatiquement).

### Étape 2 — Aucun changement frontend

Le frontend (`AIChatBot.tsx`, `useChatAssistant.tsx`, `ChatMessage.tsx`) reste identique. Les suggestions dans l'UI (« Créer un client », « Biens disponibles ») fonctionneront naturellement puisque le backend les supportera.

## Fichiers impactés
- `supabase/functions/chat-assistant/index.ts` — réécriture complète de la logique outils + prompt

## Ce qui ne change PAS
- Aucun changement de design
- Aucun changement UI
- Aucun changement dashboard
- Aucun changement aux autres modules
- Aucune migration SQL (les tables et RLS existent déjà)
- Aucun nouveau fichier frontend

