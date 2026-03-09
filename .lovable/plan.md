

# Ajout de la signature sur les factures et devis

## Analyse

La signature est stockée dans `entreprises.signature` comme un data URL (image PNG/JPG) via le composant `SignaturePad`. Les composants `InvoicePreview` et `QuotePreview` ont déjà une zone "Signature & Cachet" mais elle est vide (juste un cadre décoratif). Les pages `Factures.tsx` et `Devis.tsx` ne récupèrent pas le champ `signature` de la base de données.

## Modifications

### 1. `src/pages/Factures.tsx` et `src/pages/Devis.tsx`
- Ajouter `signature` à l'interface `Entreprise` et à la requête `select()` de `fetchEntreprise`

### 2. `src/components/InvoicePreview.tsx`
- Ajouter `signature?: string | null` à l'interface `entreprise` dans les props
- Dans la zone "Signature & Cachet" : si une signature existe, afficher l'image à la place du cercle décoratif central, avec un léger effet d'opacité et un positionnement élégant
- Conserver le cadre avec les coins décoratifs pour encadrer la signature

### 3. `src/components/QuotePreview.tsx`
- Même modification que InvoicePreview

### 4. Templates HTML d'impression (dans Factures.tsx et Devis.tsx)
- Intégrer l'image de signature dans les templates `printDevis`/`printFacture` et `downloadAsHtml` si la signature existe

## Design de la signature
- L'image signature s'affiche centrée dans le cadre existant avec `max-height: 80%`, `object-contain`
- Le cadre passe de `dashed` à `solid` quand une signature est présente (plus professionnel)
- Le label "Signature & Cachet" et le nom de l'entreprise en dessous sont conservés
- Aucun changement de structure ou de layout

