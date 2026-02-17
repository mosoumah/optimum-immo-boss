

## Studio IA -- Accelerateur de Vente Immobiliere

Module independant ajoute a l'application sans modifier aucune fonctionnalite existante.

---

### 1. Base de donnees (2 nouvelles tables + 1 bucket storage)

**Table `ai_generated_images`**
| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid (PK) | Identifiant unique |
| entreprise_id | uuid (FK -> entreprises) | Entreprise proprietaire |
| created_by | uuid | Utilisateur createur |
| format | text | "instagram_post" ou "instagram_story" |
| prompt_used | text | Prompt envoye a Gemini |
| image_url | text | URL de l'image dans le bucket storage |
| bien_description | text | Description du bien |
| prix | text (nullable) | Prix affiche |
| mention | text | "Disponible", "A vendre", "A louer" |
| include_logo | boolean | Logo agence inclus |
| include_phone | boolean | Numero de telephone inclus |
| created_at | timestamptz | Date de creation |

**Table `redesign_requests`**
| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid (PK) | Identifiant unique |
| entreprise_id | uuid (FK -> entreprises) | Entreprise proprietaire |
| created_by | uuid | Utilisateur createur |
| original_image_url | text | URL de la photo originale |
| result_image_url | text (nullable) | URL de l'image modifiee |
| instruction | text | Instruction de modification |
| status | text | "pending", "completed", "failed" |
| created_at | timestamptz | Date de creation |

**Table `studio_ia_quotas`**
| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid (PK) | Identifiant |
| entreprise_id | uuid (FK -> entreprises, UNIQUE) | 1 ligne par entreprise |
| plan | text | "standard", "pro", "premium" |
| generations_used | integer | Nombre de generations ce mois |
| month_year | text | "2026-02" pour reset mensuel |
| updated_at | timestamptz | Derniere mise a jour |

Limites par plan :
- Standard : 10 generations/mois
- Pro : 50 generations/mois  
- Premium : 100 generations/mois

**Bucket storage** : `studio-ia` (public) pour stocker les images generees et uploadees.

**RLS** : Toutes les tables sont protegees par `entreprise_id = get_user_entreprise_id(auth.uid())`, accessibles aux roles admin et agent uniquement.

---

### 2. Edge Function : `studio-ia-generate`

Une seule edge function qui gere deux types de requetes :

**Type "visual"** (Onglet 1 - Creation visuel reseaux sociaux) :
- Recoit : description du bien, prix, mention, options (logo, telephone), format
- Utilise Lovable AI avec le modele `google/gemini-2.5-flash-image` pour generer l'image
- Le prompt inclut les couleurs de branding de l'entreprise
- Sauvegarde l'image base64 dans le bucket `studio-ia`
- Enregistre la reference dans `ai_generated_images`

**Type "redesign"** (Onglet 2 - Redesign et Modification IA) :
- Recoit : URL de l'image originale + instruction textuelle
- Utilise Lovable AI avec `google/gemini-2.5-flash-image` en mode edition d'image
- Sauvegarde le resultat dans le bucket `studio-ia`
- Met a jour `redesign_requests` avec l'URL du resultat

**Verification quota** : Avant chaque generation, verifie le quota dans `studio_ia_quotas`. Si le mois a change, reset le compteur. Si le quota est depasse, retourne une erreur 403.

---

### 3. Frontend

**Fichier `src/pages/StudioIA.tsx`** -- Page principale du module

Structure :
- Meme layout que les autres pages (DynamicSidebar + FloatingParticles + h-screen flex overflow-hidden)
- 2 onglets via le composant `Tabs` de shadcn/radix

**Onglet 1 : "Creation Visuel Reseaux Sociaux"**
- Formulaire :
  - Textarea : description du bien
  - Input : prix (optionnel, avec toggle afficher/masquer)
  - Select : mention ("Disponible" / "A vendre" / "A louer")
  - Switch : inclure logo agence
  - Switch : inclure numero de telephone
  - Select : format ("Instagram Post 1080x1080" / "Story 1080x1920")
- Bouton "Creer visuel"
- Zone de resultat avec l'image generee
- Boutons : Telecharger / Regenerer
- Compteur de quota restant affiche en haut

**Onglet 2 : "Redesign et Modification IA"**
- Upload d'image (drag & drop ou click)
- Textarea : instruction de modification
- Bouton "Modifier avec l'IA"
- Affichage avant/apres cote a cote (ou empile sur mobile)
- Boutons : Telecharger / Regenerer
- Mention obligatoire sous l'image : "Simulation visuelle a titre illustratif"
- Compteur de quota restant

**Galerie** : En dessous de chaque onglet, affichage des generations precedentes de l'entreprise avec miniatures.

---

### 4. Integration dans le menu lateral

**Fichier `src/components/DynamicSidebar.tsx`** :
- Ajouter une entree apres "Documents IA" :
  - Icone : `ImagePlus` (lucide-react)
  - Label : "Studio IA"
  - Path : `/studio-ia`
  - Roles : `["admin", "agent"]`

---

### 5. Route dans App.tsx

Ajouter la route `/studio-ia` protegee par `RoleProtectedRoute` avec `allowedRoles={["admin", "agent"]}`, positionnee apres `/documents-ia`.

---

### 6. Configuration edge function

Ajouter dans `supabase/config.toml` :
```text
[functions.studio-ia-generate]
verify_jwt = false
```

---

### 7. Fichiers crees ou modifies

| Fichier | Action |
|---------|--------|
| Migration SQL | Creer tables + bucket + RLS |
| `supabase/functions/studio-ia-generate/index.ts` | Nouvelle edge function |
| `supabase/config.toml` | Ajouter config function |
| `src/pages/StudioIA.tsx` | Nouvelle page |
| `src/components/DynamicSidebar.tsx` | Ajouter entree menu |
| `src/App.tsx` | Ajouter route |

Aucune modification sur les tables, pages ou composants existants (clients, factures, revenus, dashboard, etc.).

