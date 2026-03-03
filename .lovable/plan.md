
# Auto-termination des reservations et comptabilisation des revenus

## Objectif
Quand une reservation a le statut "en_cours" et que la date de depart est passee, elle doit automatiquement passer en "terminee" et le montant doit apparaitre sur le dashboard (via la facture marquee comme payee).

## Approche
Creer une fonction SQL cote base de donnees qui met a jour automatiquement les reservations expirees, puis l'appeler depuis le frontend au chargement du Dashboard et de la page Reservations.

## Modifications

### 1. Migration SQL : fonction `auto_complete_reservations`
Creer une fonction `public.auto_complete_reservations(_entreprise_id uuid)` qui :
- Cherche toutes les reservations avec `statut = 'en_cours'` et `date_depart < CURRENT_DATE` pour l'entreprise donnee
- Met a jour leur statut en `terminee`
- Pour chaque reservation terminee, cherche la facture liee (meme `client_id`, `entreprise_id`, description contenant le nom du bien) avec statut `non_paye`, et la passe en `paye`
- Le trigger existant `handle_facture_paid` creera automatiquement l'entree dans la table `revenus`, ce qui affichera le montant sur le dashboard

```text
Flux :
reservation en_cours (date_depart passee)
  -> statut = terminee
  -> facture liee -> statut = paye
  -> trigger handle_facture_paid -> insert revenus
  -> dashboard affiche le montant
```

### 2. Page Reservations (`src/pages/Reservations.tsx`)
- Ajouter un appel a `supabase.rpc("auto_complete_reservations", { _entreprise_id: entrepriseId })` dans `fetchReservations`, avant de charger les donnees
- Cela garantit que les statuts sont a jour a chaque visite de la page

### 3. Page Dashboard (`src/pages/Dashboard.tsx`)
- Ajouter le meme appel RPC au chargement du dashboard (dans un `useEffect`), pour que les KPI soient a jour meme si l'utilisateur ne visite pas la page Reservations

### Ce qui ne change PAS
- Le formulaire de reservation
- Les autres pages
- La sidebar, les dialogs
- Les RLS policies existantes
