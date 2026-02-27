

# Ajout de la suppression des biens

## Objectif
Permettre de supprimer un bien depuis la page de detail (`BienDetail.tsx`), avec confirmation et nettoyage de l'image associee dans le storage.

## Fichier modifie

**`src/pages/BienDetail.tsx`**

### Changements

1. Ajouter un bouton "Supprimer" (rouge) dans l'en-tete de la page, a cote du badge de statut
2. Ajouter un `AlertDialog` de confirmation avant suppression ("Etes-vous sur de vouloir supprimer ce bien ?")
3. Logique de suppression :
   - Si le bien a une `cover_image_url`, supprimer le fichier du bucket `property-covers` (`{entreprise_id}/{property_id}.jpg`)
   - Supprimer le bien de la table `properties`
   - Afficher un toast de succes
   - Rediriger vers `/biens`
4. Importer `useNavigate` de react-router-dom, `Trash2` de lucide-react, `AlertDialog` des composants UI, et le hook `useToast`

### Ce qui ne sera PAS modifie
- Aucune autre page
- Aucune migration de base
- La sidebar reste inchangee
- Les RLS existantes supportent deja le DELETE pour admin/agent

