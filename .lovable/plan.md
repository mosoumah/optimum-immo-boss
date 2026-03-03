

# Amelioration Documents IA : Upload, Signature & Lisibilite Premium

## 1. Upload de document existant avec re-branding automatique

**Nouveau composant `UploadDocumentDialog.tsx`** :
- Dialog permettant d'uploader un fichier texte (.txt) ou de coller le contenu d'un document existant dans un textarea
- A la soumission, le contenu est enregistre dans la table `documents` avec l'entreprise_id de l'utilisateur
- Le document uploade herite automatiquement du logo, de la charte graphique (couleurs) et de la signature de l'entreprise via `DocumentPreview` -- aucun traitement IA necessaire, c'est le preview qui applique le branding

**`DocumentsIA.tsx`** :
- Ajouter un second bouton "Importer un document" a cote de "Nouveau document"
- Ouvre le `UploadDocumentDialog`

## 2. Signature : upload d'image + dessin a la souris

**Nouveau composant `SignaturePad.tsx`** :
- Canvas HTML5 pour dessiner une signature a la souris/tactile
- Boutons : Effacer, Valider (convertit le canvas en data URL)
- Upload d'une image de signature (PNG/JPG) comme alternative
- Sauvegarde la signature dans `entreprises.signature` (champ existant, actuellement texte -- on le reutilise pour stocker l'URL ou le data URL de l'image)

**Integration dans `Parametres.tsx`** :
- Ajouter une section "Signature" sous le LogoUpload existant
- Affiche la signature actuelle si elle existe
- Boutons pour dessiner ou importer une nouvelle signature

**`DocumentPreview.tsx`** :
- La zone signature (lignes 458-496) affiche deja `entreprise.signature` comme image -- il faut juste s'assurer que le rendu fonctionne avec un data URL ou une URL de storage
- Aucune modification necessaire si la signature est stockee comme URL d'image

## 3. Amelioration de la lisibilite du contenu

**`DocumentPreview.tsx`** -- ajustements typographiques premium :
- Augmenter la taille du corps de texte de `text-base` (16px) a 17px pour plus de confort
- Augmenter l'interligne de `leading-loose` a un `line-height: 2` personnalise
- Ajouter un leger `letter-spacing: 0.01em` sur les paragraphes
- Les labels (lignes avec `:`) utilisent un `font-size: 15px` avec `font-weight: 600` au lieu de `<strong>`
- Les headers de section utilisent un soulignement decoratif (fine ligne accent sous le titre)
- Le contenu du document utilise `color: #2a2a2a` (plus fonce) au lieu de `#333`

**`ViewDocumentDialog.tsx`** :
- Pas de changement de scale (deja a 0.75)

## 4. Application automatique de la signature sur tous les documents

La signature est deja affichee dans `DocumentPreview.tsx` via `entreprise.signature`. Une fois que l'utilisateur sauvegarde sa signature (image URL ou data URL) dans la table `entreprises`, elle apparaitra automatiquement sur tous les documents generes et existants lors de la visualisation/export PDF.

## Fichiers concernes

| Fichier | Action |
|---|---|
| `src/components/SignaturePad.tsx` | Nouveau -- canvas de dessin + upload image |
| `src/components/dialogs/UploadDocumentDialog.tsx` | Nouveau -- importer un document existant |
| `src/pages/Parametres.tsx` | Ajouter section signature |
| `src/pages/DocumentsIA.tsx` | Ajouter bouton "Importer" |
| `src/components/DocumentPreview.tsx` | Ajustements typographiques |

### Aucun changement sur
- La structure de la base de donnees (le champ `entreprises.signature` existe deja)
- Les factures, devis, ou autres pages
- Le `DocumentDialog` de generation IA

