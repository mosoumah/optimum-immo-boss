

# Amelioration de l'affichage du montant total dans le formulaire de reservation

## Constat

Le calcul automatique du montant total est deja en place dans le code. Il fonctionne quand les **trois champs** (date d'arrivee, date de depart, prix unitaire) sont remplis. Si l'un des trois manque, le total affiche "0 GNF", ce qui peut donner l'impression que rien ne se passe.

## Ameliorations prevues

**Fichier** : `src/components/dialogs/ReservationDialog.tsx`

1. **Affichage dynamique du montant total** : Au lieu d'afficher "0 GNF" quand les champs ne sont pas encore tous remplis, afficher un message explicatif comme "Remplir dates et prix" pour guider l'utilisateur.

2. **Mise en evidence visuelle** : Quand le montant total est calcule (superieur a 0), l'afficher en gras avec une couleur distincte (vert/primary) pour bien montrer que le calcul a ete effectue.

3. **Affichage du detail du calcul** : Ajouter une petite ligne de detail sous le montant total montrant le calcul (ex: "3 jours x 600 000 GNF") pour que l'utilisateur comprenne comment le total est obtenu.

## Detail technique

- Modifier l'affichage du `montantTotal` (ligne 192-194) pour inclure un texte conditionnel
- Ajouter un calcul du nombre d'unites (jours/semaines/mois) pour l'afficher dans le detail
- Aucune modification de la logique de calcul elle-meme (deja correcte)
- Aucune autre page modifiee
