

# Plan : Convertir le graphique en Area Chart avec degrades

## Fichier unique a modifier : `src/components/FinancialChart.tsx`

### Changements

1. **Import** : Remplacer `LineChart, Line` par `AreaChart, Area` depuis `recharts`.

2. **Ajouter des `<defs>` SVG** dans le `<AreaChart>` pour definir deux gradients lineaires :
   - `gradientRevenus` : `#22c55e` a 30% d'opacite en haut → transparent en bas
   - `gradientDepenses` : `#ef4444` a 20% d'opacite en haut → transparent en bas

3. **Remplacer les `<Line>`** par des `<Area>` avec :
   - `type="monotone"` (courbes lisses, deja en place)
   - `fill="url(#gradientRevenus)"` / `fill="url(#gradientDepenses)"`
   - `fillOpacity={1}` pour utiliser l'opacite definie dans le gradient
   - Conserver `stroke`, `strokeWidth`, `dot`, `activeDot` identiques

4. **Remplacer `<LineChart>`** par `<AreaChart>` (memes props : data, margin).

Aucun autre fichier modifie. Le layout, le PDF et le dashboard restent intacts.

