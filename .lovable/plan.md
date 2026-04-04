

# Notification quotidienne des départs clients

## Approche

Créer une fonction SQL `SECURITY DEFINER` qui, chaque jour, identifie les réservations avec départ aujourd'hui et insère une notification pour chaque admin et agent de l'entreprise concernée. Un cron job pg_cron déclenche cette fonction à 8h30 UTC.

## Plan

### Étape 1 — Migration SQL

Créer une fonction `notify_departures_today()` :
- Boucle sur toutes les réservations avec `date_depart = CURRENT_DATE` et `statut IN ('en_cours', 'confirmee', 'en_attente')`
- Pour chaque réservation, récupère le nom du client, le nom du bien, les coordonnées
- Insère une notification (type `depart_jour`) pour chaque utilisateur admin/agent de l'entreprise
- Anti-duplication : vérifie qu'aucune notification `depart_jour` avec `reference_id = reservation.id` n'existe déjà pour aujourd'hui

### Étape 2 — Cron job pg_cron

Planifier `notify_departures_today()` à `30 8 * * *` (8h30 UTC chaque jour).

### Étape 3 — Icône notification

Ajouter le type `depart_jour` dans `getNotificationIcon()` de `NotificationBell.tsx` avec une icône 🚪 ou 🏠 pour distinguer visuellement les départs.

### Étape 4 — Corriger la politique RLS INSERT notifications

La politique actuelle exige `user_id = auth.uid()`, ce qui empêche les triggers et fonctions SECURITY DEFINER d'insérer pour d'autres utilisateurs. Ajouter une politique permissive pour le rôle `postgres` ou supprimer la restriction sur INSERT (les notifications sont protégées en SELECT/UPDATE/DELETE par `user_id = auth.uid()`).

Vérification : la politique INSERT actuelle `(user_id = auth.uid())` bloque déjà les triggers existants (`handle_tache_assigned`, `handle_tache_message_notification`). Ces triggers fonctionnent car ils sont `SECURITY DEFINER` et contournent RLS. La nouvelle fonction sera aussi `SECURITY DEFINER`, donc pas de changement RLS nécessaire.

## Détails techniques

### Fonction SQL `notify_departures_today()`

```text
FOR each reservation WHERE date_depart = CURRENT_DATE
  AND statut IN ('en_cours','confirmee','en_attente')
DO
  client_info = nom + telephone from clients table
  message = "Départ prévu : {client_nom} - {property_name} | Contact: {telephone}"
  
  FOR each admin/agent in entreprise DO
    INSERT INTO notifications (user_id, type, titre, message, reference_id)
    -- with anti-duplicate check on (user_id, type, reference_id, created_at::date)
  END
END
```

### Cron schedule
`30 8 * * *` — exécution quotidienne à 8h30 UTC.

## Fichiers impactés
- 1 migration SQL (fonction + cron job)
- `src/components/NotificationBell.tsx` — ajout icône pour type `depart_jour`

## Ce qui ne change PAS
- Aucun changement de design
- Aucune nouvelle page ou composant
- Aucun changement aux autres modules

