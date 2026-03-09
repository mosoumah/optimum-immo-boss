
# Élimination des espaces blancs dans le PDF

J'ai identifié pourquoi tu obtiens parfois de grandes zones blanches en bas de page : l'algorithme actuel est trop prudent. S'il ne trouve pas un grand espace vide (comme un gros saut de paragraphe), il préfère casser la page très tôt (parfois à 30% de la hauteur) pour éviter de couper une ligne.

Pour régler ça de manière créative et élégante sans toucher au design visuel, je vais implémenter une **stratégie de remplissage intelligent à double passe** :

## 1. Détection "Chirurgicale" (Interligne)
Je vais affiner le "scanner d'encre" pour qu'il cherche des espaces de **10 pixels** au lieu de 40. Cela lui permettra de se glisser discrètement **entre deux lignes de texte** au sein d'un même paragraphe si nécessaire. Ainsi, on n'a plus besoin d'un saut de paragraphe pour changer de page.

## 2. Stratégie Double Passe (Remplissage Forcé)
*   **Passe Agressive (85% à 100%)** : L'algorithme sera forcé de remplir la page au moins jusqu'à 85%. Il cherchera un espace entre les lignes uniquement tout en bas de la page. Fini les pages à moitié vides.
*   **Passe de Sauvetage (30% à 85%)** : Si, et seulement si, le bas de la page est un bloc massif *insécable* (comme une grande image ou un gros tableau coloré), l'algorithme reculera intelligemment pour casser la page au-dessus de l'image, garantissant qu'elle ne soit pas coupée en deux. 

## 3. Mise à l'échelle Anti-écrasement
Si l'algorithme déborde d'un ou deux millimètres pour attraper la fin parfaite d'une phrase, l'image sera très légèrement redimensionnée de manière proportionnelle sur le PDF A4. Le texte restera net et ne sera plus jamais écrasé ou déformé verticalement.

## Fichier modifié
`src/components/dialogs/ViewDocumentDialog.tsx` (L'export PDF du Document IA uniquement).
