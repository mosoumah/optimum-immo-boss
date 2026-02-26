

# Image principale pour chaque bien immobilier

## Objectif
Ajouter une image de couverture unique par bien, avec upload securise, affichage dans la liste et gestion du remplacement/suppression.

---

## 1. Migration base de donnees

Ajouter la colonne `cover_image_url` a la table `properties` :

```sql
ALTER TABLE public.properties ADD COLUMN cover_image_url text;
```

## 2. Bucket Storage

Creer le bucket `property-covers` (public) avec la structure `{entreprise_id}/{property_id}.jpg`.

Policies RLS sur `storage.objects` :
- **SELECT** : tout le monde (bucket public)
- **INSERT / UPDATE / DELETE** : uniquement les utilisateurs admin/agent dont le `entreprise_id` correspond au chemin du fichier

## 3. Modification du dialogue BienDialog

**Fichier** : `src/components/dialogs/BienDialog.tsx`

- Ajouter un champ d'upload d'image (input file, accept `image/*`)
- Apercu de l'image selectionnee ou de l'image existante (en mode edition)
- Validation cote frontend : taille max 2 Mo, redimensionnement a 1200px max largeur via un canvas avant upload
- Bouton de suppression de l'image existante
- Flow :
  1. Creer/modifier le bien dans `properties`
  2. Si une image est selectionnee, upload dans `property-covers/{entreprise_id}/{property_id}.jpg`
  3. Recuperer l'URL publique
  4. `UPDATE properties SET cover_image_url = url WHERE id = property_id`
  5. En cas de remplacement, supprimer l'ancien fichier du storage avant upload

## 4. Modification de la liste des biens

**Fichier** : `src/pages/Biens.tsx`

- Ajouter `cover_image_url` au `select` de la requete
- Dans chaque carte de bien, ajouter l'image en haut :
  - Hauteur fixe `h-40`, `object-cover`, `rounded-t-xl`
  - `loading="lazy"` pour le chargement differe
  - Skeleton de chargement pendant le chargement de l'image
  - Placeholder avec icone `Building` si aucune image

## 5. Modification de la page detail

**Fichier** : `src/pages/BienDetail.tsx`

- Afficher `cover_image_url` a la place de l'icone `Building` dans le cercle si l'image existe

---

## Details techniques

### Redimensionnement frontend (canvas)

```text
resizeImage(file) :
  - Creer un canvas
  - Si largeur > 1200px, reduire proportionnellement
  - Exporter en JPEG qualite 0.85
  - Retourner un Blob
```

### Fichiers modifies

| Fichier | Changement |
|---|---|
| Migration SQL | Ajout colonne `cover_image_url` + bucket + policies storage |
| `src/components/dialogs/BienDialog.tsx` | Upload image, apercu, validation 2 Mo, redimensionnement |
| `src/pages/Biens.tsx` | Affichage image dans les cartes, skeleton, lazy loading |
| `src/pages/BienDetail.tsx` | Affichage image dans la fiche detail |

### Ce qui ne sera PAS modifie
- Sidebar
- Routes
- Permissions existantes
- Autres tables
- Vues SQL du dashboard
- Aucune galerie multi-images

