
# Corrections de la logique des reservations et nettoyage du formulaire

## Objectif
1. Ne marquer "terminee" que si la facture liee est payee (pas automatiquement a l'expiration de la date)
2. L'argent n'apparait sur le dashboard que quand la facture est payee (deja le cas via le trigger `handle_facture_paid`)
3. Les arrivees/departs se mettent a jour automatiquement sur le dashboard (deja fonctionnel via la vue `v_dashboard_simple`)
4. Supprimer le champ "Type de location" du formulaire de reservation

## Modifications

### 1. Migration SQL : modifier `auto_complete_reservations`
La fonction actuelle marque automatiquement les reservations comme "terminee" ET passe les factures en "paye". Il faut inverser la logique :
- Ne marquer la reservation comme "terminee" QUE si toutes les factures liees sont deja payees
- Si les factures ne sont pas payees, la reservation reste "en_cours" (pas de changement automatique)

```text
Nouvelle logique :
reservation en_cours (date_depart passee)
  -> verifier si facture liee est "paye"
    -> OUI : statut = terminee (l'argent est deja sur le dashboard)
    -> NON : ne rien faire (reste en_cours, pas d'argent sur le dashboard)
```

### 2. Formulaire ReservationDialog (`src/components/dialogs/ReservationDialog.tsx`)
- Supprimer le champ "Type de location" (le Select Jour/Semaine/Mois, lignes 179-189)
- Forcer `type_location` a "jour" par defaut dans le state et le payload (la colonne existe toujours en base mais on ne la montre plus)
- Simplifier le calcul du montant total pour utiliser uniquement les jours
- Supprimer le label dynamique "jour/semaine/mois" sous le montant total

### 3. Dashboard (`src/pages/Dashboard.tsx`)
- L'appel RPC `auto_complete_reservations` reste en place mais avec la nouvelle logique SQL
- Les arrivees/departs sont deja comptes via la vue `v_dashboard_simple` qui filtre sur `CURRENT_DATE` — pas de changement necessaire cote code

### Ce qui ne change PAS
- La page Reservations (liste)
- La sidebar, les autres pages
- La vue `v_dashboard_simple` (les arrivees/departs fonctionnent deja)
- Le trigger `handle_facture_paid` (inchange)

## Details techniques

### Migration SQL
```sql
CREATE OR REPLACE FUNCTION public.auto_complete_reservations(...)
-- Boucle sur reservations en_cours avec date_depart < CURRENT_DATE
-- Pour chaque reservation, verifie si une facture liee existe et est "paye"
-- Si oui : UPDATE statut = 'terminee'
-- Si non : ne rien faire
```

### ReservationDialog
- Retirer le bloc Select "Type de location"
- Le calcul `montantTotal` utilise toujours `differenceInDays` (type_location = "jour")
- Le label sous le montant affiche toujours "X jour(s)"
