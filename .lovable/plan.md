

# Recap complet — Analyse de toutes les fonctionnalites

Apres analyse du code, de la base de donnees et des vues SQL, voici les problemes identifies et leur statut.

---

## Ce qui FONCTIONNE correctement

1. **Graphique Revenus vs Depenses** — Corrige : utilise `formatLocalDate` (pas de decalage UTC), ecoute les tables `revenus`, `depenses` et `factures` en temps reel.
2. **Trigger `handle_facture_paid`** — Quand une facture passe a "paye", un revenu est cree automatiquement. Fonctionne.
3. **Trigger `handle_reservation_payment_sync`** — Quand une facture **liee** a une reservation passe a "paye", `montant_paye` de la reservation est mis a jour. Fonctionne pour les nouvelles reservations.
4. **ReservationDialog** — Stocke desormais `reservation_id` dans la facture generee. Fonctionne.
5. **Revenus** — Affichage correct (titre "Revenu" pour les manuels, nom client pour les factures). Suppression admin operationnelle.
6. **Factures** — Marquage "payee", generation PDF, impression. Fonctionne.

---

## Problemes IDENTIFIES (a corriger)

### 1. Reservations orphelines sans lien facture (donnees historiques)

**Probleme** : 5 reservations n'ont aucune facture liee (`reservation_id IS NULL`). Le script de rattrapage de la migration n'a pas reussi a les lier car les descriptions des factures ne correspondaient pas au pattern `%Location%` + `%property_name%`.

Reservations concernees :
- `99bfaf5e` : "appartement", 1 400 000, paye 300 000, statut `en_cours`
- `bd2f4521` : "appartement 2", 900 000, paye 300 000, statut `en_cours`  
- `0cd9a38f` : "appartement", 400 000, paye 0, statut `terminee`
- `ddd9a694` : "—", 2 500 000, paye 0, statut `terminee`
- Plusieurs anciennes (A1, A2) sans facture liee

**Impact** : Le dashboard affiche toujours "Paiements attendus: 2 700 000 GNF" et la page Reservations affiche "Paiements en retard" pour des reservations dont la facture est peut-etre payee mais pas liee.

**Correction** : Migration SQL pour nettoyer les donnees :
- Lier manuellement les factures aux reservations par `client_id` + `entreprise_id` + correspondance de montant
- Mettre a jour `montant_paye = montant_total` pour les reservations dont la facture est payee
- Marquer comme `terminee` les reservations expirees avec facture payee

### 2. Bug de date UTC dans Reservations.tsx (ligne 84)

**Probleme** : La page Reservations utilise `new Date().toISOString().split("T")[0]` pour `today`, ce qui peut decaler d'un jour (meme bug qu'on a corrige dans le graphique).

**Impact** : Les compteurs "Arrivees aujourd'hui", "Departs aujourd'hui" et "Sejours en cours" peuvent etre decales.

**Correction** : Remplacer par `formatLocalDate(new Date())`.

### 3. `auto_complete_reservations` utilise `reservation_id` mais aussi description pattern

**Probleme** : La fonction SQL cherche les factures par `description ILIKE '%property_name%'` au lieu d'utiliser le nouveau champ `reservation_id`. Cela ne fonctionne pas pour les factures dont la description ne contient pas exactement le nom du bien.

**Correction** : Mettre a jour la fonction pour utiliser `f.reservation_id = _res.id` en priorite, avec le pattern en fallback.

### 4. Reservation `confirmee` — statut non gere

**Probleme** : Une reservation (id `5d4ddf76`) a le statut `confirmee` qui n'existe pas dans les labels/couleurs de l'interface. Elle n'apparait ni dans les filtres de la vue dashboard ni dans `auto_complete_reservations`.

**Correction** : Soit la migrer vers `en_cours`, soit ajouter le statut dans l'interface.

### 5. Facture doublon sur reservation `de4a6eb9`

**Probleme** : La reservation `de4a6eb9` a deux factures liees (`d6a37150` et `d8237bd3`), toutes deux payees. Cela pourrait fausser les revenus si deux revenus ont ete generes.

**Correction** : Verifier et supprimer le doublon si necessaire.

---

## Plan de correction

### Migration SQL
1. Mettre a jour `auto_complete_reservations` pour utiliser `reservation_id`
2. Nettoyer les reservations orphelines (lier factures, corriger `montant_paye`)
3. Migrer le statut `confirmee` vers `en_cours`
4. Verifier et supprimer les doublons de factures

### Code
1. **`src/pages/Reservations.tsx` ligne 84** : Remplacer `new Date().toISOString().split("T")[0]` par une fonction locale pour eviter le decalage UTC
2. Ajouter le meme helper `formatLocalDate` utilise dans `FinancialChart.tsx`

---

## Resume

| Fonctionnalite | Statut |
|---|---|
| Graphique Revenus vs Depenses | OK |
| Ajout revenu manuel | OK |
| Ajout depense | OK |
| Marquer facture payee → revenu auto | OK |
| Facture liee a reservation (nouvelles) | OK |
| Paiements attendus dashboard | BUG — donnees historiques non liees |
| Paiements en retard reservations | BUG — meme cause |
| Compteurs arrivees/departs/sejours | BUG — decalage UTC |
| Auto-complete reservations | BUG — ne cherche pas par reservation_id |
| Statut "confirmee" orphelin | BUG mineur — non gere dans UI |
| Facture doublon | BUG mineur — a nettoyer |

