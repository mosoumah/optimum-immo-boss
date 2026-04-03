

# Suppression de factures (admin) + Correction revenus dashboard

## Problèmes identifiés

1. **Pas de bouton supprimer** sur la page Factures — la permission `supprimer_facture` existe mais n'est pas utilisée côté UI.
2. **Revenus des factures payées ne s'affichent pas** sur le dashboard du mois en cours — le trigger `handle_facture_paid_global` utilise `NEW.date` (date de la facture) au lieu de `CURRENT_DATE`. Si une facture datée de mars est payée en avril, le revenu est enregistré avec une date de mars et n'apparaît pas dans les revenus d'avril.
3. **La politique RLS DELETE** autorise aussi les agents (pour leurs factures) — l'utilisateur veut admin uniquement.

## Plan

### Étape 1 — Migration SQL

1. **Corriger `handle_facture_paid_global`** : remplacer `NEW.date` par `CURRENT_DATE` pour que le revenu soit comptabilisé dans le mois du paiement.
2. **Restreindre le DELETE factures à admin uniquement** : remplacer la politique RLS `Role-based factures delete`.
3. **Ajouter un trigger `on_facture_deleted`** : quand une facture est supprimée, supprimer automatiquement le revenu associé (`revenus.facture_id = OLD.id`) pour garder la cohérence financière.

### Étape 2 — UI `Factures.tsx`

1. Ajouter un import `Trash2` et `useUserRole`.
2. Ajouter une fonction `supprimerFacture` avec vérification de permission (`supprimer_facture`) + confirmation.
3. Ajouter un bouton Supprimer (icône poubelle rouge) visible uniquement pour les admins via `PermissionGate permission="supprimer_facture"`.
4. Après suppression : toast de succès + rafraîchir la liste.

### Résultat attendu

- Seul l'admin peut supprimer une facture.
- Supprimer une facture supprime aussi le revenu associé automatiquement.
- Payer une facture crée un revenu avec la date du jour → visible immédiatement sur le dashboard.
- Bénéfice estimé (revenus - dépenses) se met à jour automatiquement.

### Fichiers impactés
- 1 migration SQL
- `src/pages/Factures.tsx`

