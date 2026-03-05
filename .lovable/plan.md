

# Séparer Revenus et Factures — Plan de correction

## Problème actuel

La table `revenus` a une colonne `facture_id` **NOT NULL**, ce qui force le code à créer une fausse facture à chaque ajout manuel de revenu. Résultat : chaque revenu manuel apparaît aussi dans la liste des factures, et prend le nom d'un client au hasard.

## Solution

Suivre le même modèle que les dépenses (`depenses`) : la table `depenses` a simplement `description`, `montant`, `date`, `entreprise_id` — pas de lien obligatoire vers une autre table.

### 1. Migration SQL
- Ajouter une colonne `source` (text, nullable) à la table `revenus` pour stocker la description des revenus manuels
- Rendre `facture_id` **nullable** (au lieu de NOT NULL) pour permettre les revenus non liés à une facture

```sql
ALTER TABLE public.revenus ADD COLUMN source text;
ALTER TABLE public.revenus ALTER COLUMN facture_id DROP NOT NULL;
```

### 2. Refactorer `RevenuDialog.tsx`
- Supprimer toute la logique de création de facture
- Insérer directement dans `revenus` avec : `source`, `montant`, `date`, `entreprise_id`, `facture_id: null`
- Le formulaire reste identique (source, montant, date) — exactement comme `DepenseDialog`

### 3. Mettre à jour `Revenus.tsx` (affichage)
- Pour les revenus avec `facture_id` : afficher le nom du client et la description de la facture (comportement actuel)
- Pour les revenus sans `facture_id` (manuels) : afficher la colonne `source` comme description
- Adapter le type `Revenu` pour inclure `source: string | null`

### 4. Nettoyage des fausses factures existantes
- Optionnel : supprimer les factures créées artificiellement par l'ancien code (celles avec `statut = 'paye'` et un client "Revenu manuel")

## Fichiers modifiés
- Migration SQL (1 fichier)
- `src/components/dialogs/RevenuDialog.tsx` — simplification majeure
- `src/pages/Revenus.tsx` — adapter l'affichage pour les revenus avec/sans facture

