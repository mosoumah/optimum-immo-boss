

# Analyse : Pourquoi "Paiements attendus" et "Paiements en retard" ne bougent pas

## Probleme racine identifie

Les factures et les reservations **ne sont pas liees** dans la base de donnees. Quand une facture generee depuis une reservation est marquee comme "payee", **rien ne met a jour le champ `montant_paye` de la reservation**. Voici la chaine cassee :

```text
Reservation (montant_paye = 300 000) 
    → Facture generee (montant = 1 400 000)
        → Facture marquee "payee" ✓
            → Revenu cree ✓ (via trigger handle_facture_paid)
            → Reservation.montant_paye mis a jour ✗ (AUCUN LIEN)
```

**Preuves dans la base** : Toutes les reservations ont encore leur `montant_paye` initial (0 ou le montant verse a la creation), meme celles dont les factures sont payees. C'est pour ca que le dashboard affiche toujours 2 700 000 GNF et les "5 paiements en retard" ne descendent jamais.

## Corrections

### 1. Ajouter `reservation_id` sur la table `factures`
Colonne nullable `uuid` referencant `reservations(id)` pour lier facture et reservation.

### 2. Stocker le lien a la creation de la facture
Dans `ReservationDialog.tsx`, apres insertion de la reservation, recuperer son `id` et l'inclure dans le payload de la facture.

### 3. Trigger : mettre a jour `montant_paye` quand la facture est payee
Creer une fonction SQL `handle_reservation_payment_sync` declenchee apres UPDATE sur `factures`. Quand une facture liee a une reservation passe a "paye", le trigger met a jour `reservations.montant_paye = montant_total` de la reservation liee.

### 4. Corriger les donnees existantes
Script de rattrapage pour les reservations terminees dont les factures sont deja payees : mettre leur `montant_paye = montant_total`.

## Fichiers modifies
- **Migration SQL** : ajouter colonne `reservation_id`, trigger de sync, et script de rattrapage
- **`src/components/dialogs/ReservationDialog.tsx`** : recuperer l'id de la reservation inseree, le passer lors de la creation de la facture

