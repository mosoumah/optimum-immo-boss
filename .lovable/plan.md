

# Plan : Restructurer le formulaire de generation de documents IA

## Perimetre strict
- Modifier UNIQUEMENT `src/components/dialogs/DocumentDialog.tsx` (formulaire)
- Mettre a jour `supabase/functions/generate-document/index.ts` (pour passer les nouveaux champs au prompt IA)
- Ne PAS toucher au PDF, au dashboard, ni a aucun autre fichier

## Donnees disponibles dans la base

Les champs du formulaire seront pre-remplis depuis les donnees existantes quand possible :
- **Entreprise** (`entreprises`) : `nom`, `telephone`, `email`, `adresse`, `signature`
- **Client** (`clients`) : `nom`, `telephone`, `email` (pas d'adresse en base — champ libre)
- **Bien** (`properties`) : `nom`, `adresse`, `type_bien`, `prix`
- **Agent** (`profiles`) : `nom`, `email`

## Structure du formulaire (7 sections avec accordeons ou separateurs visuels)

### Section 1 — Informations du document
- Type de document (Select, existant)
- Numero de document (Input, libre, ex: "DOC-2026-001")
- Date de creation (DatePicker, default aujourd'hui)

### Section 2 — Informations de l'agence
- Nom de l'agence (Input, pre-rempli depuis `entreprise.nom`)
- Nom de l'agent (Input, pre-rempli depuis `profile.nom`)
- Telephone (Input, pre-rempli depuis `entreprise.telephone`)
- Email (Input, pre-rempli depuis `entreprise.email`)

### Section 3 — Informations du client
- Client (Select existant depuis la base, auto-remplit les champs suivants)
- Telephone (Input, pre-rempli quand client selectionne)
- Email (Input, pre-rempli quand client selectionne)
- Adresse (Input, champ libre car pas en base)

### Section 4 — Informations du bien
- Bien (Select depuis `properties`, auto-remplit les champs suivants)
- Adresse du bien (Input, pre-rempli)
- Type de bien (Input, pre-rempli)

### Section 5 — Informations de la transaction
- Prix de vente / Loyer (Input)
- Duree de location (Input)
- Caution (Input)

### Section 6 — Clauses
- Textarea pour clauses personnalisees

### Section 7 — Signatures
- Signature client : mention textuelle (la signature physique se fait hors systeme)
- Signature agence : affichage de la signature existante depuis `entreprise.signature`
- Date de signature (DatePicker, default aujourd'hui)

## Modifications fichiers

### 1. `src/components/dialogs/DocumentDialog.tsx`
- Ajouter tous les nouveaux champs d'etat (documentNumber, creationDate, agencyName, agentName, agencyPhone, agencyEmail, clientPhone, clientEmail, clientAddress, propertyId, propertyTitle, propertyAddress, propertyType, salePrice, rentalDuration, securityDeposit, clauses, signatureDate)
- Fetch supplementaire : `profiles` (pour nom agent) et `properties` (pour liste biens)
- Auto-remplissage quand client ou bien selectionne
- Organiser en 7 sections visuelles avec `Separator` et titres de section
- Passer tous les champs dans le body de l'appel edge function `generate-document`
- Conserver la logique d'enregistrement existante (insert dans `documents` avec type, contenu, client_id, entreprise_id)

### 2. `supabase/functions/generate-document/index.ts`
- Recevoir les nouveaux champs dans le body JSON
- Enrichir le `systemPrompt` et le `userPrompt` avec toutes les informations structurees (agence, client, bien, transaction, clauses)
- Garder le meme modele IA et la meme logique de nettoyage

