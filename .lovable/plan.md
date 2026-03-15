

# Correction : auto-complétion des réservations expirées et statut des biens

## Problème identifié

La fonction `auto_complete_reservations` ne marque une réservation comme "terminée" **que si** la facture associée est payée. Si la facture n'est pas payée (ou n'existe pas), la réservation reste "en cours" et le bien reste "réservé" indéfiniment, même après la date de départ.

De plus, le statut `en_attente` n'est pas vérifié dans la boucle.

## Solution

Modifier la fonction pour qu'elle complète automatiquement **toute réservation dont la date de départ est passée**, indépendamment du statut de paiement de la facture :

1. **Migration SQL** : Réécrire `auto_complete_reservations` pour :
   - Inclure les statuts `en_attente`, `en_cours`, `confirmee`
   - Marquer comme `terminee` toute réservation avec `date_depart < CURRENT_DATE`, sans condition sur le paiement de la facture
   - Mettre à jour `montant_paye` uniquement si la facture est effectivement payée (ne pas forcer `montant_paye = montant_total` si ce n'est pas le cas)
   - Remettre le bien en `disponible` s'il n'a plus de réservation active

2. **Aucun changement côté code** : Les appels existants dans `Reservations.tsx` et `Dashboard.tsx` restent identiques.

## Détails techniques

```sql
-- Nouvelle logique simplifiée
FOR _res IN
  SELECT ... FROM reservations
  WHERE entreprise_id = _entreprise_id
    AND statut IN ('en_attente', 'en_cours', 'confirmee')
    AND date_depart < CURRENT_DATE
LOOP
  -- Toujours terminer la réservation
  UPDATE reservations SET statut = 'terminee', updated_at = now() WHERE id = _res.id;
  
  -- Mettre à jour montant_paye si facture payée
  -- ...
  
  -- Libérer le bien si plus de réservation active
  -- ...
END LOOP;
```

## Fichiers impactés
- 1 migration SQL (nouvelle)
- Aucun fichier front-end modifié

