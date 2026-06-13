## Problèmes identifiés

1. **Liste Factures (mobile)** : Le contenu est aligné à gauche/empilé, contrairement à la page Revenus où le titre/sous-titre sont à gauche et le montant/date à droite sur une seule ligne centrée verticalement.
2. **Aperçu de la facture (mobile)** : Le composant `InvoicePreview` a une largeur fixe `width: "210mm"` (~794px). Sur mobile (384px), il déborde horizontalement et apparaît énorme/coupé.

## Changements

### 1. `src/pages/Factures.tsx` — Liste des factures
Aligner sur le style de Revenus : ligne unique centrée verticalement même sur mobile.
- Remplacer `flex-col sm:flex-row` par `flex-row items-center` toujours
- Structure : icône (à gauche, fixe) · bloc titre/description (flex-1, truncate) · bloc montant + badge (à droite) · actions
- Sur très petit écran : masquer la description (`hidden sm:block`) ou la garder en `line-clamp-1`, masquer le badge sous l'icône payée pour ne garder que les icônes d'action compactes
- Boutons d'action : icônes seules sur mobile (déjà partiellement le cas), s'assurer qu'ils restent sur la même ligne avec `flex-shrink-0`

### 2. `src/components/InvoicePreview.tsx` — Aperçu responsive
- Retirer `width: "210mm"` fixe ; utiliser `width: "100%"`, `maxWidth: "210mm"`, et `minHeight` conservé pour rendu PDF correct
- Wrapper externe avec `overflow-x-auto` dans le Dialog pour permettre scroll si besoin sur très petit écran
- Réduire les paddings sur mobile : `p-4 sm:p-10`, tailles de texte réduites (`text-lg sm:text-2xl` pour h1, `text-xl sm:text-3xl` pour total)
- Header : passer en `flex-col sm:flex-row` pour empiler logo+nom et badge FACTURE sur mobile
- Logo : `w-16 h-16 sm:w-24 sm:h-24`
- Badge FACTURE : padding réduit `px-4 py-2 sm:px-8 sm:py-4`

### 3. `src/pages/Factures.tsx` — Dialog d'aperçu
- `DialogContent` : ajouter `w-[95vw] sm:max-w-4xl p-3 sm:p-6` pour mieux remplir mobile
- Wrapper `InvoicePreview` dans `<div className="overflow-x-auto">` pour sécurité
- Boutons du footer : `flex-wrap` + `flex-1 sm:flex-none` pour qu'ils tiennent sur mobile

**Important** : la largeur fixe 210mm était utilisée pour la capture html2canvas → le PDF utilise déjà un iframe séparé (lignes 230-326) avec son propre HTML 800px, donc retirer la largeur fixe du composant React n'affecte PAS la qualité du PDF généré.

## Fichiers modifiés
- `src/pages/Factures.tsx` (liste + dialog aperçu)
- `src/components/InvoicePreview.tsx` (responsive layout)
