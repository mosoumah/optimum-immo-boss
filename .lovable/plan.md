

# Corrections et nouvelles fonctionnalites pour Documents IA

## Probleme 1 : Textes non visibles dans le document

Le `ViewDocumentDialog` applique un `scale-[0.6]` sur le preview, ce qui reduit drastiquement la taille du texte. De plus, la fonction `renderContent` dans `DocumentPreview.tsx` supprime les marqueurs de formatage (gras, titres) sans les rendre visuellement, et la couleur `#444` manque de contraste.

### Correction

**`ViewDocumentDialog.tsx`** :
- Remplacer `scale-[0.6]` par `scale-[0.75]` pour un meilleur equilibre lisibilite/apercu
- Ajouter une largeur max pour eviter le debordement

**`DocumentPreview.tsx`** - Ameliorer `renderContent` pour parser correctement le contenu :
- Les lignes en MAJUSCULES ou avec `**texte**` sont rendues en `<strong>` avec une taille plus grande et la couleur primaire
- Les lignes commencant par `:` ou contenant des labels (ex: `Nom et Prenoms :`) utilisent un style semi-bold
- Le texte de base utilise `color: #333` (plus fonce) au lieu de `#444`
- Espacement entre paragraphes `mb-5` au lieu de `mb-4` pour plus de respiration
- Cela reproduit le meme rendu que la section AI content de `InvoicePreview`

## Probleme 2 : Ajouter edition et suppression de documents

### Suppression

**`DocumentsIA.tsx`** :
- Ajouter un bouton Supprimer (icone Trash) sur chaque ligne de document
- Confirmation via `AlertDialog` avant suppression
- Appel `supabase.from("documents").delete().eq("id", doc.id)` puis rafraichissement de la liste

### Edition

**Nouveau composant `EditDocumentDialog.tsx`** :
- Dialog avec un `Textarea` pre-rempli avec le contenu actuel du document
- L'utilisateur peut modifier/effacer/remplacer du texte librement
- Bouton Enregistrer qui fait un `supabase.from("documents").update({ contenu }).eq("id", doc.id)`
- Possibilite de changer le type de document via un Select

**`DocumentsIA.tsx`** :
- Ajouter un bouton Editer (icone Pencil) sur chaque ligne
- Ouvre le `EditDocumentDialog` avec le document selectionne

### Fichiers modifies
- `src/components/DocumentPreview.tsx` : ameliorer `renderContent`
- `src/components/dialogs/ViewDocumentDialog.tsx` : ajuster le scale
- `src/pages/DocumentsIA.tsx` : ajouter boutons edit/delete + dialogs
- `src/components/dialogs/EditDocumentDialog.tsx` : nouveau composant

