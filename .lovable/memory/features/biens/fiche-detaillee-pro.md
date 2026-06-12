---
name: Property Detailed Sheet
description: Biens étendus avec galerie multi-images, documents PDF, vidéos, caractéristiques détaillées, statistiques et historique. Statuts inchangés (disponible/réservé), pas de Vente.
type: feature
---
## Schéma
- Table `properties` étendue : description_longue, quartier, commune, ville, chambres, salons, salles_bain, video_url, équipements bool (cuisine, parking, balcon, piscine, internet, climatisation, meuble).
- Catégories élargies UI : appartement, villa, maison, terrain, bureau, magasin, entrepot.
- Table `property_media` (id, property_id, entreprise_id, media_type ['image'|'document'|'video'], bucket, storage_path, nom_fichier, is_cover, ordre). Trigger garantit un seul `is_cover` image par bien. RLS scopée `entreprise_id`.

## Storage
3 buckets privés : `property-gallery`, `property-documents`, `property-videos`. RLS storage.objects par dossier `{entreprise_id}/`. URLs signées TTL 1h via `usePropertyMedia`.

## UI
- `BienDialog` : 5 onglets (Général, Localisation, Caract., Description, Médias). L'onglet Médias n'est actif qu'après création initiale (createdId).
- `BienDetail` : galerie + lightbox, infos prix, localisation, features grid, description longue, vidéo (YouTube/Vimeo embed ou upload), documents téléchargeables, stats cards (revenus, nb réservations, taux occupation, dernière), historique en 3 onglets (en cours / à venir / passées).
- Statistiques calculées côté client depuis `reservations` (pas de FK).

## Limites upload
Images 5 Mo, PDF 10 Mo, vidéos 50 Mo.

## Hors scope (conservé)
Pas de "Vente" ni "Type d'opération" qui modifierait la finance. Statuts biens restent `disponible`/`réservé`. Réservations restent journalières.
