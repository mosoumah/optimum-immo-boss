
## Objectif
Corriger définitivement la non-génération de facture automatique depuis le formulaire de réservation, sans modifier autre chose.

## Cause racine identifiée
Le flux actuel de création de réservation fait :
- `insert(payload).select().single()` sur `reservations`
- puis un contrôle global `if (result.error) return`

Dans certains cas de règles d’accès (RLS), l’insertion peut réussir **mais** la partie `select().single()` ne retourne pas la ligne (ou retourne une erreur “no rows / single”), ce qui met `result.error`.
Résultat :
- la réservation est bien créée en base,
- mais le code sort trop tôt (`return`) et n’exécute jamais l’insertion de facture.

C’est pour cela que le problème persiste même après le changement précédent sur `result.data`.

## Correctif ciblé (un seul fichier)
**Fichier :** `src/components/dialogs/ReservationDialog.tsx`

### 1) Sécuriser l’insert réservation
Remplacer la création de réservation :
- **Avant** : `insert(payload).select().single()`
- **Après** : `insert(payload)` (sans `select`, sans `single`)

But : ne plus dépendre d’un retour de lecture pour considérer la création comme réussie.

### 2) Conserver la logique d’erreur réelle
Garder le bloc :
- `if (result.error) { ... return; }`
Mais après le point 1, cette erreur reflètera uniquement un vrai échec d’insertion (et non un faux négatif lié à la lecture post-insert).

### 3) Déclenchement facture automatique
Conserver la condition de facture pour nouvelle réservation :
- `if (form.generer_facture && !reservation && !result.error) { ... }`
Elle fonctionnera correctement une fois le faux `result.error` éliminé.

## Pourquoi ce fix est le bon
- Il corrige précisément le point de rupture du flux.
- Il ne touche ni les pages factures, ni les permissions, ni le schéma base de données.
- Il respecte ta demande : **ne rien modifier d’autre**.

## Vérification après implémentation
1. Créer une nouvelle réservation avec “Générer facture automatiquement” coché.
2. Vérifier qu’aucun toast d’erreur de réservation n’apparaît.
3. Vérifier qu’une ligne est bien insérée dans `factures`.
4. Vérifier que le message succès “réservation créée et facture générée” s’affiche.
