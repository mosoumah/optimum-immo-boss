

# Limiter les statuts des biens a "Disponible" et "Reserve"

## Ce qui change

### 1. Formulaire de creation/modification de bien (`BienDialog.tsx`)
- Supprimer les options "Vendu" et "Loue" du selecteur de statut (lignes 260-261)
- Garder uniquement "Disponible" et "Reserve"

### 2. Page liste des biens (`Biens.tsx`)
- Supprimer les options "Vendu" et "Loue" du filtre de statut (lignes 131-132)
- Supprimer les entrees correspondantes dans `statutColors` et `statutLabels` (lignes vendu/loue)

### 3. Page detail du bien (`BienDetail.tsx`)
- Supprimer les entrees "vendu" et "loue" de `statutColors` (lignes 16-17)

### 4. Formulaire de reservation (`ReservationDialog.tsx`)
- Le filtrage des biens reserves est deja en place (filtre `statut !== 'reserve'`). Aucun changement necessaire.

### 5. Trigger existant (aucun changement)
- Le trigger `handle_reservation_property_status` gere deja la bascule entre "reserve" (quand reservation en_cours) et "disponible" (quand terminee/annulee). Rien a modifier.

## Ce qui ne change PAS
- La base de donnees (pas de migration SQL)
- Le trigger de statut automatique
- Les RLS policies
- Tout autre composant ou page

## Details techniques

Fichiers modifies :
- `src/components/dialogs/BienDialog.tsx` : retirer 2 SelectItem (vendu, loue)
- `src/pages/Biens.tsx` : retirer 2 SelectItem du filtre + nettoyer statutColors/statutLabels
- `src/pages/BienDetail.tsx` : nettoyer statutColors

