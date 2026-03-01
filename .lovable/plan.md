

# Afficher "Reservations" dans la sidebar

## Constat

L'element "Reservations" existe deja dans la sidebar (ligne 41 de `DynamicSidebar.tsx`), place entre "Biens" et "Devis". Cependant, il est conditionne par l'activation du module Location (`requires: "location"`). Si ce module n'est pas active dans les parametres, l'element ne s'affiche pas.

## Solution

Retirer la condition `requires: "location"` de l'entree "Reservations" dans la sidebar pour qu'elle soit toujours visible, comme Clients, Biens, Devis, etc.

## Fichier modifie

**`src/components/DynamicSidebar.tsx`** - ligne 41

### Changement

Supprimer `requires: "location"` de la definition de l'item Reservations :

```text
// Avant :
{ icon: CalendarCheck, label: "Reservations", path: "/reservations", roles: ["admin", "agent"], requires: "location" },

// Apres :
{ icon: CalendarCheck, label: "Reservations", path: "/reservations", roles: ["admin", "agent"] },
```

### Ce qui ne sera PAS modifie
- Aucune autre page ou composant
- Aucune migration
- La logique du formulaire de reservation reste inchangee
