

# Modifier la structure d'affichage et gestion des revenus

## Changements demandés

### 1. Corriger l'affichage des revenus manuels
- **Titre (en haut)** : Toujours afficher "Revenu" pour les revenus manuels (au lieu de la source)
- **Sous-titre (en bas)** : Afficher la `source` saisie (ex: "Notre part du marché") au lieu de "Revenu manuel"
- Pour les revenus liés à une facture : garder le nom du client en haut et la description de la facture en bas

### 2. Ajouter un dialog de détail au clic
- Créer un dialog qui s'ouvre quand on clique sur un revenu
- Affiche : source ou client, montant, date, type (manuel ou facture)

### 3. Ajouter la suppression (admin uniquement)
- Ajouter une RLS policy DELETE sur la table `revenus` pour les admins uniquement
- Bouton "Supprimer" dans le dialog de détail, protégé par `PermissionGate`
- Après suppression, rafraîchir la liste

## Fichiers modifiés
- **Migration SQL** : ajouter policy DELETE admin-only sur `revenus`
- **`src/pages/Revenus.tsx`** : corriger l'affichage titre/sous-titre, ajouter le dialog de détail avec vue + suppression

