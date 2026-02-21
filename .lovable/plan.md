

## Correction des 3 problemes identifies

### Probleme 1 : Les reservations et transactions ne s'affichent pas apres creation

**Cause** : Les pages `Reservations.tsx` et `Transactions.tsx` utilisent des jointures PostgREST (`.select("*, clients(nom), properties(nom)")`) qui necessitent des cles etrangeres formelles dans la base de donnees. Or, les tables `reservations` et `sales_transactions` n'ont pas de FK vers `clients` et `properties`, donc la requete retourne une erreur 400.

**Note** : L'INSERT fonctionne correctement (statut 201), mais le rafraichissement de la liste echoue a cause de cette jointure.

**Solution** : Remplacer les jointures PostgREST par des requetes simples sans jointure, puis charger les noms des clients et biens separement cote application. Concretement :

- Dans `Reservations.tsx` : changer `.select("*, clients(nom), properties(nom)")` en `.select("*")`, puis faire un lookup des noms de clients via un state local
- Dans `Transactions.tsx` : meme correction
- Les noms des clients et biens sont deja charges dans les dialogs, on peut reutiliser cette logique

### Probleme 2 : "Utilisateurs" et "Permissions" invisibles dans le sidebar

**Cause** : La balise `<nav>` dans `DynamicSidebar.tsx` (ligne 100) utilise `overflow-hidden`. Avec l'ajout des nouveaux menus (Biens, Reservations, Transactions), la liste depasse la hauteur disponible et les derniers elements sont coupes.

**Solution** : Changer `overflow-hidden` en `overflow-y-auto` sur la balise nav pour permettre le defilement.

---

### Details techniques

**Fichiers modifies** :

| Fichier | Modification |
|---------|-------------|
| `src/components/DynamicSidebar.tsx` | Changer `overflow-hidden` en `overflow-y-auto` sur la nav (ligne 100) |
| `src/pages/Reservations.tsx` | Remplacer la jointure `.select("*, clients(nom), properties(nom)")` par `.select("*")` et charger les noms de clients/biens separement |
| `src/pages/Transactions.tsx` | Meme correction que Reservations |

**Aucune modification de base de donnees requise.**

