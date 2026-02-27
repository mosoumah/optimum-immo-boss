

# Correction : Generation automatique de facture lors d'une reservation

## Probleme identifie

Dans `ReservationDialog.tsx`, la fonction `handleSubmit` enregistre `generer_facture: true` dans la table `reservations`, mais **aucun code ne cree effectivement une facture dans la table `factures`**. Le flag est stocke sans effet.

## Solution

Ajouter la logique de creation de facture dans `handleSubmit`, juste apres l'insertion reussie de la reservation, si `form.generer_facture` est coche.

## Fichier modifie

**`src/components/dialogs/ReservationDialog.tsx`** - fonction `handleSubmit`

### Changements

Apres l'insertion reussie de la reservation (et uniquement pour une nouvelle reservation, pas une modification), si `form.generer_facture` est `true` :

1. Recuperer l'`id` de la reservation nouvellement creee (modifier l'insert pour utiliser `.select().single()`)
2. Inserer une facture dans la table `factures` avec :
   - `client_id` : celui de la reservation
   - `entreprise_id` : celui de l'entreprise
   - `montant` : le `montantTotal` calcule
   - `description` : reference au bien et aux dates
   - `date` : date du jour
   - `statut` : `non_paye`
3. Afficher un toast de confirmation ou d'erreur pour la facture

### Detail technique

```text
// Apres l'insert reservation reussi :
if (form.generer_facture && !reservation) {
  const { error: factureError } = await supabase.from("factures").insert({
    client_id: form.client_id,
    entreprise_id: entrepriseId,
    montant: montantTotal,
    description: `Location ${propertyName} du ${form.date_arrivee} au ${form.date_depart}`,
    date: new Date().toISOString().split("T")[0],
  });
  // Gestion erreur facture
}
```

### Ce qui ne sera PAS modifie
- Aucune autre page
- Aucune route
- Aucune table ou migration
- La sidebar reste inchangee
