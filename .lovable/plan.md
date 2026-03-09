

# Auto-remplissage du prix unitaire depuis le bien sélectionné

## Changements dans `src/components/dialogs/ReservationDialog.tsx`

1. **Récupérer le prix** : Ajouter `prix` au `select()` de la requête properties (ligne 47) : `select("id, nom, statut, prix")`

2. **Mettre à jour l'interface** : Ajouter `prix` au type du state `properties` (ligne 18) : `{ id: string; nom: string; statut: string; prix: number }`

3. **Auto-remplir au changement de bien** : Dans le `onValueChange` du Select "Bien" (actuellement ligne ~136), quand un bien est sélectionné et qu'il n'y a pas encore de prix unitaire saisi (ou en mode création), chercher le bien dans la liste et pré-remplir `prix_unitaire` avec `property.prix`

```tsx
onValueChange={(v) => {
  const selected = properties.find(p => p.id === v);
  setForm({ 
    ...form, 
    property_id: v,
    prix_unitaire: selected?.prix ? selected.prix.toString() : form.prix_unitaire 
  });
}}
```

Cela ne s'applique que lors de la sélection — l'utilisateur peut toujours modifier le prix manuellement après.

