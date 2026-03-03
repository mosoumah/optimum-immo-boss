
# Analyse complete des bugs et erreurs

## Bug 1 : Statut "confirmee" encore present (INCOHERENCE CRITIQUE)

Le statut "confirmee" a ete supprime du formulaire de reservation, mais il reste utilise dans plusieurs endroits :

**Page Reservations.tsx :**
- `statutColors` et `statutLabels` contiennent encore l'entree `confirmee` (lignes 28, 36)
- Les filtres `arriveesToday`, `departsToday`, `enCours` filtrent encore sur `"confirmee"` (lignes 86-88)
- Cela signifie que les compteurs ne detectent PAS les reservations `en_attente`

**Trigger SQL `handle_reservation_property_status` :**
- Le trigger utilise `'confirmee'` et `'en_cours'` pour marquer un bien comme reserve
- Mais puisque le statut par defaut est maintenant `en_attente`, le trigger ne se declenche PAS a la creation d'une reservation
- Resultat : un bien reste "disponible" meme apres avoir ete reserve

**Trigger SQL `auto_complete_reservations` :**
- Verifie `statut IN ('confirmee', 'en_cours')` au lieu d'inclure `en_attente`

**Vue SQL `v_dashboard_simple` :**
- Utilise probablement encore `confirmee` dans ses filtres

**Correction :** Remplacer partout `confirmee` par `en_attente` dans les filtres et triggers SQL, et supprimer l'entree `confirmee` des maps de couleurs/labels.

## Bug 2 : Suppression d'un bien ne supprime pas les factures associees

Quand un bien est supprime dans `BienDetail.tsx`, les reservations sont supprimees, mais les factures generees automatiquement pour ces reservations restent en base. Cela cree des factures orphelines.

**Correction :** Avant de supprimer les reservations, recuperer les `client_id` et `property_name` concernes, puis supprimer les factures correspondantes.

## Bug 3 : Warning React "Function components cannot be given refs"

La console affiche des warnings car `BienDialog` et `Badge` ne supportent pas les refs. Le composant `BienDialog` est passe directement comme enfant sans `forwardRef`.

**Correction :** Ce n'est pas bloquant, mais il faudrait eventuellement wrapper `BienDialog` avec `React.forwardRef` ou ajuster l'utilisation.

## Bug 4 : Compteurs de reservations incluent le mauvais statut

Les compteurs `arriveesToday` et `departsToday` dans `Reservations.tsx` (lignes 86-87) filtrent sur `["confirmee", "en_cours"]` au lieu de `["en_attente", "en_cours"]`. Puisque le statut `confirmee` n'existe plus, les reservations en attente ne sont jamais comptees dans les arrivees/departs du jour.

**Correction :** Remplacer `"confirmee"` par `"en_attente"` dans ces filtres.

## Bug 5 : Statut de reservation affiche brut dans ClientDetail

Dans `ClientDetail.tsx` ligne 243, le statut de la reservation est affiche brut (`r.statut`) au lieu d'utiliser un label lisible. Les statuts comme `en_attente`, `en_cours`, `terminee` s'affichent tels quels sans traduction.

**Correction :** Ajouter un mapping `statutLabels` pour les reservations dans `ClientDetail.tsx`.

## Bug 6 : Colonne `reservations.statut` a un default incorrect en base

La table `reservations` a `DEFAULT 'confirmee'` (visible dans le schema), mais le formulaire force `en_attente`. Si une insertion est faite sans specifier le statut, il sera `confirmee` au lieu de `en_attente`.

**Correction :** Migration SQL pour changer le default de la colonne `statut` a `'en_attente'`.

## Bug 7 : Warning "Missing Description" sur DialogContent

Les dialogues n'ont pas de `DialogDescription`, ce qui genere un warning d'accessibilite.

**Correction :** Ajouter `<DialogDescription>` dans les dialogues concernes (BienDialog, ReservationDialog).

---

## Resume des corrections

| # | Fichier / Element | Priorite |
|---|---|---|
| 1 | Trigger `handle_reservation_property_status` : ajouter `en_attente` | Critique |
| 2 | Trigger `auto_complete_reservations` : ajouter `en_attente` | Critique |
| 3 | Migration : changer default `reservations.statut` a `en_attente` | Critique |
| 4 | `Reservations.tsx` : remplacer `confirmee` par `en_attente` dans filtres et supprimer l'entree `confirmee` des maps | Important |
| 5 | Vue `v_dashboard_simple` : aligner les filtres avec `en_attente` | Important |
| 6 | `ClientDetail.tsx` : ajouter labels lisibles pour statuts reservation | Mineur |
| 7 | `BienDetail.tsx` : supprimer les factures liees lors de la suppression | Important |
| 8 | Ajouter `DialogDescription` aux dialogues | Mineur |
| 9 | Fix `forwardRef` warning sur BienDialog | Mineur |

## Details techniques

### Migration SQL necessaire
- `ALTER TABLE reservations ALTER COLUMN statut SET DEFAULT 'en_attente'`
- Mise a jour des triggers `handle_reservation_property_status` et `auto_complete_reservations` pour remplacer `'confirmee'` par `'en_attente'`
- Mise a jour de la vue `v_dashboard_simple` pour utiliser `en_attente` au lieu de `confirmee`

### Fichiers TypeScript a modifier
- `src/pages/Reservations.tsx` : nettoyer les references a `confirmee`
- `src/pages/ClientDetail.tsx` : ajouter mapping de labels pour statuts reservation
- `src/pages/BienDetail.tsx` : ajouter suppression des factures liees
- `src/components/dialogs/ReservationDialog.tsx` : ajouter DialogDescription
- `src/components/dialogs/BienDialog.tsx` : ajouter DialogDescription + forwardRef
