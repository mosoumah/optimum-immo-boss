

# Correction definitive des coupures PDF

## Probleme racine identifie

La fonction `collectDomBreakCandidates` utilise `node.offsetTop` pour determiner les positions de coupure. Or `offsetTop` est relatif au **parent positionne le plus proche** (offset parent), pas a la racine du document. Les paragraphes sont imbriques dans plusieurs `div` avec padding, bordures et arrondis. Les coordonnees retournees sont donc **fausses** : elles pointent vers des positions locales au lieu de positions absolues dans le canvas.

Resultat : les points de coupure DOM tombent au mauvais endroit, et le fallback pixel-density echoue aussi car les degrades de fond, bordures colorees et accents lateraux sont detectes comme "encre".

## Solution

### 1. Corriger le calcul des positions (probleme principal)

Remplacer `node.offsetTop` par `node.getBoundingClientRect().top - root.getBoundingClientRect().top`, qui donne la position **absolue** par rapport au haut du document clone. Multiplier par le facteur de scale html2canvas (2) pour obtenir les coordonnees en pixels canvas.

### 2. Collecter le BAS des elements, pas le haut

Pour couper entre deux paragraphes, le point de coupure ideal est la zone entre le `bottom` d'un element et le `top` du suivant. Collecter les paires `(bottom_i, top_i+1)` et utiliser le milieu comme candidat.

### 3. Augmenter la zone de scan du fallback pixel

Pour le fallback, scanner uniquement la zone centrale (20%-80% de la largeur) en excluant les bordures laterales decoratives qui polluent la detection.

## Fichier modifie

**`src/components/dialogs/ViewDocumentDialog.tsx`** uniquement.

### Changements specifiques :

- `collectDomBreakCandidates` : utiliser `getBoundingClientRect()` relatif a la racine, multiplier par `scale`, et collecter les gaps inter-elements (milieu entre bottom et top suivant)
- Passer le parametre `scale` (2) a la fonction
- `findSafeBreakPoint` : resserrer la zone de scan horizontale a 20%-80% pour ignorer les accents lateraux
- Dans `handleDownloadPDF` : appeler `collectDomBreakCandidates(clone, 2)` apres que le clone est insere dans le DOM (necessaire pour `getBoundingClientRect`)

