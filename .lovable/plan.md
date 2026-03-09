

# Correction des espaces blancs en bas de page PDF

## Problème identifié

L'algorithme actuel a deux faiblesses qui créent du blanc en bas de page :

1. **Priorité DOM trop forte sur le rescue** : Quand aucun saut DOM n'existe dans la zone 85-100%, l'algo cherche un saut DOM dans 30-85%, et peut casser la page dès 30% — laissant 70% de blanc.

2. **Le fallback pixel n'est jamais utilisé si un DOM rescue existe** : Le fallback pixel (qui peut trouver un espace inter-ligne à 95%) est ignoré au profit d'un saut DOM à 50%.

## Solution

### Fichier modifié : `src/components/dialogs/ViewDocumentDialog.tsx`

**Nouvelle logique de priorité :**

1. Chercher un saut DOM dans la zone agressive (90-100%) — priorité maximale
2. Si rien : utiliser le **fallback pixel** dans la zone agressive (90-100%) — il trouvera un espace inter-ligne
3. **Seulement si la densité pixel est très élevée** (image/tableau insécable, densité > 15%) : autoriser un rescue DOM plus bas (70-90%)
4. Relever le minimum agressif de 85% à **90%** pour forcer un remplissage maximal
5. Relever le minimum rescue de 30% à **70%** pour interdire les pages à moitié vides

**Changements concrets :**
- Ligne 284 : `aggressiveSliceHeightPx` = `pageHeightPx * 0.90` (au lieu de 0.85)
- Ligne 282 : `minSliceHeightPx` = `pageHeightPx * 0.70` (au lieu de 0.30)
- Lignes 294-306 : Réorganiser la logique pour que le pixel fallback soit prioritaire sur le DOM rescue. Le DOM rescue ne s'active que si `bestDensity > 0.15` (image détectée)

