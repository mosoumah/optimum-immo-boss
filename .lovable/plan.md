
## Objectif
Corriger la page `/taches` pour que :
1. Le contenu soit **toujours centré** et **responsive**
2. Plus aucun élément ne soit coupé (boutons, dates, etc.)
3. La page fonctionne correctement dans un **nouvel onglet navigateur** à toutes les tailles d'écran

## Diagnostic technique
- La sidebar desktop est visible à partir de `lg:` (1024px)
- Le décalage `lg:pl-64` dans le `<main>` s'active aussi à `lg:`
- **Problème** : Entre 768px et 1023px, et même autour de 1024-1100px, le contenu peut déborder car le calcul `100vw - 256px` ne laisse pas assez de place pour le contenu `max-w-6xl` (72rem = 1152px)
- Le bouton "Nouvelle tâche" avec `whitespace-nowrap` (hérité de `buttonVariants`) force le texte à rester sur une ligne, poussant le bouton hors de l'écran

## Solution proposée

### Changements dans `src/pages/Taches.tsx`

**1) Changer le système de décalage sidebar**
- Problème : `lg:pl-64` sur le `<main>` + `max-w-6xl` crée un débordement
- Solution : Utiliser `lg:ml-64` (marge) au lieu de `lg:pl-64` (padding)
  - Cela permet au flexbox de calculer correctement la largeur disponible
  - Le `max-w-6xl mx-auto` centrera le contenu dans l'espace restant

Modification :
```text
<main className="flex-1 mesh-gradient min-h-screen lg:pl-64">
```
devient :
```text
<main className="flex-1 mesh-gradient min-h-screen lg:ml-64">
```

**2) Ajouter un wrapper de padding interne**
- Le wrapper actuel `<div className="p-4 lg:p-8">` est déjà présent et correct

**3) Empêcher le débordement horizontal du conteneur central**
- Ajouter `overflow-hidden` sur le wrapper `max-w-6xl` pour contenir tout débordement de contenu

Modification :
```text
<div className="max-w-6xl mx-auto relative z-10">
```
devient :
```text
<div className="max-w-6xl mx-auto relative z-10 overflow-hidden">
```

**4) Gérer les boutons sur petits écrans**
- Les boutons utilisent `whitespace-nowrap` par défaut (dans `buttonVariants`)
- Le texte est déjà masqué sur mobile avec `hidden sm:inline`
- Mais entre `sm` (640px) et `lg` (1024px), le texte est visible et peut déborder

Solution : Ajouter `whitespace-normal` sur les boutons qui ont du texte long pour permettre le retour à la ligne si nécessaire, ou bien masquer le texte jusqu'à un breakpoint plus large.

Pour rester cohérent avec le design actuel (texte masqué sur mobile), je propose de changer `hidden sm:inline` en `hidden lg:inline` sur les boutons "Messagerie", "Suggestions IA" et "Nouvelle tâche" pour que le texte ne s'affiche que sur desktop large.

Modifications sur les 3 boutons :
- `<span className="hidden sm:inline">Messagerie</span>` → `<span className="hidden md:inline">Messagerie</span>`
- `<span className="hidden sm:inline">Suggestions IA</span>` → `<span className="hidden md:inline">Suggestions IA</span>`
- `<span className="hidden sm:inline">Nouvelle tâche</span>` → `<span className="hidden md:inline">Nouvelle tâche</span>`

Cela permet d'afficher uniquement les icônes sur tablette (640-767px), et le texte à partir de `md:` (768px) où il y a plus de place.

## Résumé des modifications

| Ligne | Avant | Après |
|-------|-------|-------|
| 197 | `lg:pl-64` | `lg:ml-64` |
| 199 | `max-w-6xl mx-auto relative z-10` | `max-w-6xl mx-auto relative z-10 overflow-hidden` |
| 230 | `hidden sm:inline` | `hidden md:inline` |
| 245 | `hidden sm:inline` | `hidden md:inline` |
| 249 | `hidden sm:inline` | `hidden md:inline` |

## Vérification
Après implémentation, tester dans un nouvel onglet navigateur :
- À 1366px : sidebar + contenu centré, tous les boutons visibles
- À 1024px : sidebar + contenu, boutons avec texte visibles
- À 800px : sidebar mobile (hamburger), boutons avec texte visibles
- À 640px : sidebar mobile, boutons sans texte (icônes seulement)
- À 375px : mobile, tout visible et fonctionnel
