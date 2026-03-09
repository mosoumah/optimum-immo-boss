

# Correction des espaces blancs restants dans le PDF

## Diagnostic

En analysant les pages du PDF generé, j'ai identifié la cause exacte : les séparateurs `---` entre les articles du document créent des bandes de pixels 100% blancs. Le scanner actuel, en balayant depuis `idealY` (100%) vers `aggressiveMinY` (90%), tombe sur ces séparateurs à ~92-95% de la page et **retourne immédiatement** (`if (density < 0.01) return y`). Le contenu suivant (qui aurait pu tenir sur la page) est repoussé à la page suivante.

## Solution : "Greedy Fill" — Toujours préférer le point le plus haut

### Fichier modifié : `src/components/dialogs/ViewDocumentDialog.tsx`

**3 changements ciblés :**

1. **Supprimer le retour anticipé dans la passe agressive** (lignes 96-120) : Au lieu de `return y` dès qu'on trouve une densité < 0.01, on continue à scanner mais on enregistre le meilleur candidat. On ne retourne immédiatement que si on est à moins de 2% de `idealY` (quasiment pleine page). Cela force l'algorithme à remplir la page au maximum avant de casser.

2. **Relever le seuil agressif de 90% à 95%** (ligne 284) : La zone de recherche primaire sera les 5 derniers pourcents de la page seulement. Si rien n'est trouvé là, le scanner s'élargit automatiquement vers le bas via la passe de sauvetage.

3. **Optimiser la logique de sélection finale** (lignes 294-308) : Simplifier la priorité — le pixel fallback dans la zone 95-100% est prioritaire. Le DOM rescue (70-95%) ne s'active que si le pixel fallback donne un résultat en dessous de 93% (contenu dense insécable détecté).

