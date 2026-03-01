
# Correction du calcul automatique du montant total

## Probleme

Quand la date de depart est anterieure a la date d'arrivee (dates inversees), `differenceInDays` retourne un nombre negatif. Le `Math.max(..., 1)` ramene alors le nombre de jours a 1, ce qui donne un montant total incorrect (prix unitaire x 1 au lieu du vrai nombre de jours).

## Solution

**Fichier** : `src/components/dialogs/ReservationDialog.tsx`

1. **Utiliser la valeur absolue** dans le calcul : remplacer `differenceInDays(end, start)` par `Math.abs(differenceInDays(end, start))` (idem pour semaines et mois) afin que le calcul fonctionne meme si l'utilisateur inverse les dates.

2. **Afficher un avertissement** sous les champs de date quand la date de depart est anterieure a la date d'arrivee, pour que l'utilisateur puisse corriger si necessaire (texte orange : "La date de depart est avant la date d'arrivee").

3. **Garantir un minimum de 1 unite** : conserver le `Math.max(..., 1)` apres le `Math.abs` pour eviter un total a 0 si les dates sont identiques.

## Detail technique

Dans le `useMemo` (environ ligne 80-88), modifier les calculs :

```text
// Avant :
if (form.type_location === "jour") units = Math.max(differenceInDays(end, start), 1);
else if (form.type_location === "semaine") units = Math.max(Math.ceil(differenceInDays(end, start) / 7), 1);
else units = Math.max(differenceInMonths(end, start), 1);

// Apres :
const totalDays = Math.abs(differenceInDays(end, start));
if (form.type_location === "jour") units = Math.max(totalDays, 1);
else if (form.type_location === "semaine") units = Math.max(Math.ceil(totalDays / 7), 1);
else units = Math.max(Math.abs(differenceInMonths(end, start)), 1);
```

Ajouter un indicateur `datesInversees` :

```text
const datesInversees = form.date_arrivee && form.date_depart &&
  new Date(form.date_depart) < new Date(form.date_arrivee);
```

Afficher un message d'avertissement orange sous les champs de dates quand `datesInversees` est vrai.
