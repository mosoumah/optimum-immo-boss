

# Supprimer le module Transactions du projet

## Fichiers a supprimer
1. `src/pages/Transactions.tsx` - la page principale
2. `src/components/dialogs/TransactionDialog.tsx` - le dialogue de creation/edition

## Fichiers a modifier

### 1. `src/App.tsx`
- Supprimer l'import de `Transactions` (ligne 20)
- Supprimer la route `/transactions` (lignes 96-102)

### 2. `src/components/DynamicSidebar.tsx`
- Supprimer l'entree `Transactions` du menu lateral (ligne 43)
- Supprimer l'import de l'icone `Handshake` si elle n'est plus utilisee ailleurs dans ce fichier

### 3. `src/pages/BienDetail.tsx`
- Supprimer le state `transactions` et le fetch `sales_transactions` (lignes 29, 38, 43)
- Supprimer la section d'affichage des transactions dans le JSX (lignes 117-134)
- Supprimer l'import de `Handshake` si plus utilise

## Ce qui ne sera PAS modifie
- La table `sales_transactions` dans la base de donnees (elle restera en place)
- La page `Parametres.tsx` (le toggle "Vente" y restera car il peut servir a d'autres fonctionnalites)
- La page `Index.tsx` (la mention "transactions" dans la description est generique)
- Le dashboard, les graphiques, le footer, et tout le reste du projet

