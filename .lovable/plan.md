
# Plan — Fiche bien professionnelle

Scope strict : module **Biens uniquement**. Aucune modification de Réservations, Factures, Revenus, Dashboard, Notifications. Les statuts restent `disponible` / `réservé`. Pas de "Vente" ni "Type d'opération" (règles projet conservées).

---

## 1. Base de données (migration)

Extension de la table `properties` (champs nullable, rétro-compatible) :

- `description_longue` (text)
- `quartier`, `commune`, `ville` (text) — `adresse` existant conservé
- `chambres`, `salons`, `salles_bain` (int)
- `cuisine`, `parking`, `balcon`, `piscine`, `internet`, `climatisation`, `meuble` (boolean, default false)
- `video_url` (text) — YouTube/Vimeo ou URL bucket
- `type_bien` : élargi côté UI à appartement, villa, maison, terrain, bureau, magasin, entrepôt (champ text existant, pas de contrainte enum à ajouter)

Nouvelle table `property_media` (galerie + documents + vidéos uploadées) :
- `property_id`, `entreprise_id`, `media_type` ('image' | 'document' | 'video'), `url`, `storage_path`, `nom_fichier`, `is_cover` (bool), `ordre` (int)
- RLS : SELECT/INSERT/UPDATE/DELETE scopés à `entreprise_id` via `get_user_entreprise_id(auth.uid())`
- GRANT authenticated + service_role
- Trigger : si `is_cover=true`, mettre tous les autres media images du même bien à `is_cover=false` et synchroniser `properties.cover_image_url`

## 2. Storage

3 nouveaux buckets privés :
- `property-gallery` (images)
- `property-documents` (PDF)
- `property-videos` (mp4/webm)

RLS storage.objects : accès limité au dossier `{entreprise_id}/...` (même pattern que `property-covers`). URLs signées pour affichage.

## 3. UI — Liste `/biens`

Aucun changement majeur. Carte affiche cover (déjà OK), badge statut, prix, surface, pièces.

## 4. UI — Dialog création/édition `BienDialog`

Réorganisé en onglets (Tabs shadcn) :
1. **Général** : nom, catégorie (select élargi), prix, statut
2. **Localisation** : adresse, quartier, commune, ville
3. **Caractéristiques** : surface, chambres, salons, salles de bain, + switches (cuisine, parking, balcon, piscine, internet, climatisation, meublé)
4. **Description** : description courte + description longue (Textarea, support retours ligne)
5. **Médias** : galerie images (drag-drop multi-upload, miniatures, bouton "définir principale", suppression), URL vidéo + upload vidéo, upload PDF documents

Composants nouveaux :
- `PropertyGalleryUpload.tsx` — multi-upload images, sélection cover
- `PropertyDocumentsUpload.tsx` — PDF list + upload
- `PropertyVideoField.tsx` — URL externe ou upload

## 5. UI — Fiche détail `/biens/:id`

Refonte responsive mobile-first avec sections :

1. **Header** : retour, nom, badge statut, boutons Modifier / Supprimer
2. **Galerie** : carousel principal + miniatures cliquables + **lightbox plein écran** (composant `PropertyLightbox`)
3. **Infos clés** (grid responsive) : prix, surface, catégorie, localisation complète
4. **Caractéristiques** : grille d'icônes pour chaque équipement présent (chambres, parking, piscine, etc.)
5. **Description longue** (whitespace-pre-wrap)
6. **Vidéo** : iframe YouTube/Vimeo embed ou `<video>` natif si bucket
7. **Documents** : liste PDF téléchargeables (icône, nom, taille)
8. **Statistiques** (cards) :
   - Revenus générés = `SUM(montant_total)` des reservations liées
   - Nb réservations totales
   - Taux d'occupation = jours réservés (status `en_cours`+`terminee`) / jours depuis création du bien
   - Dernière réservation (date + client)
9. **Historique réservations** : tabs En cours / Passées / À venir, liste actuelle conservée et enrichie

Toutes les statistiques calculées **client-side** à partir de `reservations` déjà chargées (respect règle "pas de FK entre modules").

## 6. Hooks

- `usePropertyMedia(propertyId)` — fetch + mutations sur `property_media`
- `usePropertyStats(propertyId)` — calcule stats depuis réservations

## 7. Composants partagés nouveaux

- `src/components/biens/PropertyLightbox.tsx` (visionneuse plein écran clavier + swipe)
- `src/components/biens/PropertyGallery.tsx` (carousel + miniatures)
- `src/components/biens/PropertyFeatures.tsx` (grille icônes)
- `src/components/biens/PropertyStatsCards.tsx`
- `src/components/biens/PropertyMediaTab.tsx` (utilisé dans BienDialog)

## 8. Sécurité

- Validation zod côté formulaire (longueur, formats URL, taille fichier)
- Limite upload : images 5 Mo, PDF 10 Mo, vidéo 50 Mo
- Sanitization description longue à l'affichage (pas de HTML)
- RLS stricte sur les 3 buckets et `property_media`

## 9. Hors scope (confirmé)

- Pas de "Vente" / "Type d'opération" qui modifierait la logique financière
- Aucune modification de Réservations, Factures, Revenus, Dashboard, Notifications
- Statuts biens inchangés (`disponible` / `réservé`)
- Tarification réservations reste journalière

---

## Détails techniques

- Migration unique pour : ALTER `properties` (colonnes), CREATE `property_media` + GRANT + RLS + trigger cover sync
- Buckets via `supabase--storage_create_bucket` (privés)
- URLs signées générées à la volée (`createSignedUrl`, TTL 1h)
- Lightbox sans dépendance externe (Dialog shadcn + framer-motion)
- Tabs shadcn déjà installé
