## Objectif

Dans la colonne gauche du graphique « Revenus vs Dépenses », la zone vide entourée en bleu sur la capture est actuellement inutilisée. Y ajouter un bloc dédié **Taux de réservation** présenté de la même façon premium que le bloc **Bénéfice** au-dessus (grand chiffre, badge de variation, libellé période, détails). Aucune autre partie du dashboard n'est modifiée.

## Rendu visuel ciblé (colonne gauche)

```
BÉNÉFICE SEMAINE
6.4M GNF  +100.0%
vs sem. préc.

Revenus      Dépenses     Taux résa
7.4M GNF     1.0M GNF     14.3 %
─────────────────────────────────
TAUX DE RÉSERVATION         ◷
14.3 %       ▲ +3.2 pts
moyenne sur la semaine

Pic       Creux     Biens occupés
46 %      0 %       1 / 7 biens
```

Style :
- Mêmes classes typographiques que le bloc Bénéfice (uppercase tracking-widest libellé, grand chiffre semi-bold, badge variation arrondi).
- Couleur dominante : gris clair (cohérent avec la courbe pointillée), avec léger glow `drop-shadow-[0_0_6px_rgba(156,163,175,0.45)]`.
- Badge variation : vert si en hausse, rouge si en baisse, gris si stable. Unité « pts » (points de pourcentage).
- Petite icône `Percent` (lucide) à droite du libellé pour rappel visuel.
- Séparateur fin `border-t border-border/20` au-dessus du nouveau bloc.

## Données et calculs

Tout reste côté client dans `src/components/FinancialChart.tsx`.

1. **Période courante** — déjà calculée (`totals.tauxMoyen`). Ajouter dans le `useMemo` :
   - `tauxPic` = max des `taux` du `chartData`.
   - `tauxCreux` = min des `taux` du `chartData`.
   - `biensOccupesAujourdhui` = nb réservations actives qui couvrent `formatLocalDate(now)`.

2. **Période précédente** — il faut une moyenne taux comparable :
   - Charger en parallèle (dans le `Promise.all` existant) les réservations de la période précédente :
     ```ts
     supabase.from("reservations")
       .select("date_arrivee, date_depart, statut")
       .eq("entreprise_id", entrepriseId)
       .lte("date_arrivee", prevEndStr)
       .gte("date_depart", prevStartStr)
     ```
   - Stocker dans `prevReservations` (nouveau state).
   - Recalculer dans le `useMemo` un `prevTauxMoyen` en bouclant sur les jours de la période précédente avec la même formule `occupes / totalBiens × 100`.
   - `tauxVariation = tauxMoyen − prevTauxMoyen` (en points de pourcentage, pas en %).

3. **Realtime** — aucune modification, le canal `reservations` / `properties` déclenche déjà `realtimeTick`.

## Modifications de code (un seul fichier)

`src/components/FinancialChart.tsx` :

- Ajouter le state `prevReservations` et son chargement dans `Promise.all`.
- Étendre `totals` (useMemo) pour exposer `tauxMoyen`, `prevTauxMoyen`, `tauxVariation`, `tauxPic`, `tauxCreux`, `biensOccupesAujourdhui`, `totalBiens`.
- Sous le bloc grid actuel (Revenus / Dépenses / Taux résa) dans la colonne gauche, ajouter le nouveau bloc « Taux de réservation » décrit ci-dessus.
- Conserver l'icône `Percent` déjà importée. Importer `TrendingUp` / `TrendingDown` (déjà importés).

Aucun autre fichier n'est touché. Pas de migration. Pas de dépendance ajoutée. Mémoire projet respectée (`formatLocalDate`, GNF, pas de `toISOString`).
