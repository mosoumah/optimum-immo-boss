

## Architecture Modulaire -- Vente, Location, Mixte

Restructuration d'Optimum Immo pour supporter trois profils d'agence via un systeme de configuration dynamique.

---

### 1. Nouvelle table `agency_settings`

| Colonne | Type | Default | Description |
|---------|------|---------|-------------|
| id | uuid (PK) | gen_random_uuid() | Identifiant |
| entreprise_id | uuid (UNIQUE) | NOT NULL | 1 ligne par entreprise |
| vente_enabled | boolean | true | Module Vente actif |
| location_enabled | boolean | true | Module Location actif |
| created_at | timestamptz | now() | Creation |
| updated_at | timestamptz | now() | Mise a jour |

RLS : lecture/ecriture limitee a `entreprise_id = get_user_entreprise_id(auth.uid())` pour les roles admin uniquement. Les agents ont un acces en lecture seule.

A la premiere connexion d'une entreprise a la page Parametres, une ligne est inseree automatiquement avec les deux modules actifs par defaut.

---

### 2. Nouvelle table `properties` (Biens)

| Colonne | Type | Default | Description |
|---------|------|---------|-------------|
| id | uuid (PK) | gen_random_uuid() | Identifiant |
| entreprise_id | uuid | NOT NULL | Entreprise proprietaire |
| created_by | uuid | NULL | Createur |
| nom | text | NOT NULL | Nom du bien |
| adresse | text | NULL | Adresse |
| type_bien | text | NOT NULL | "appartement", "maison", "terrain", "bureau", "commercial" |
| surface | numeric | NULL | Surface en m2 |
| prix | numeric | 0 | Prix de vente ou loyer de reference |
| statut | text | 'disponible' | "disponible", "reserve", "vendu", "loue" |
| description | text | NULL | Description libre |
| nombre_pieces | integer | NULL | Nombre de pieces |
| images | text[] | NULL | URLs des photos (stockees dans bucket existant ou nouveau) |
| created_at | timestamptz | now() | Creation |
| updated_at | timestamptz | now() | Mise a jour |

RLS : meme pattern role-based que les autres tables (admin = toute l'entreprise, agent = biens qu'il a crees).

---

### 3. Table `reservations` (existante)

La table `reservations` existe deja dans la base de donnees avec la bonne structure. Elle sera modifiee pour referencer `property_id` au lieu de `property_name` :

**Colonne a ajouter** : `property_id uuid NULL` (reference vers `properties.id`, gere cote application)

L'ancien champ `property_name` reste intact pour compatibilite. Le frontend utilisera `property_id` en priorite si disponible, sinon `property_name` comme fallback.

---

### 4. Nouvelle table `sales_transactions`

| Colonne | Type | Default | Description |
|---------|------|---------|-------------|
| id | uuid (PK) | gen_random_uuid() | Identifiant |
| entreprise_id | uuid | NOT NULL | Entreprise proprietaire |
| client_id | uuid | NOT NULL | Acheteur (relation applicative) |
| property_id | uuid | NOT NULL | Bien vendu (relation applicative) |
| created_by | uuid | NULL | Agent responsable |
| montant_vente | numeric | 0 | Prix de vente final |
| commission | numeric | 0 | Commission agence |
| date_vente | date | CURRENT_DATE | Date de la transaction |
| statut | text | 'en_cours' | "en_cours", "sous_compromis", "finalisee", "annulee" |
| notes | text | NULL | Notes libres |
| created_at | timestamptz | now() | Creation |
| updated_at | timestamptz | now() | Mise a jour |

RLS : admin = toute l'entreprise, agent = ses propres transactions (`created_by = auth.uid()`).

---

### 5. Logique conditionnelle d'affichage

**Nouveau hook : `src/hooks/useAgencySettings.tsx`**

Ce hook charge les parametres `vente_enabled` et `location_enabled` depuis `agency_settings` et les met en cache via React Query.

**Modifications dans `src/components/DynamicSidebar.tsx`** :

Le tableau `sidebarItems` actuel reste statique. On ajoute un filtrage dynamique supplementaire :
- "Biens" : toujours visible si vente OU location est active
- "Reservations" : visible uniquement si `location_enabled = true`
- "Transactions" : visible uniquement si `vente_enabled = true`
- Tous les autres menus restent inchanges

Chaque item de sidebar recevra un champ optionnel `requires?: "vente" | "location"` qui sera croise avec les settings de l'agence.

**Nouvelles entrees dans le menu** :

```text
Position actuelle :
  Tableau de bord
  Clients
  Devis
  Factures
  ...

Nouveau :
  Tableau de bord
  Clients
  Biens           <-- NOUVEAU (icone Building)
  Reservations    <-- NOUVEAU (icone CalendarCheck, si location active)
  Transactions    <-- NOUVEAU (icone Handshake, si vente active)
  Devis
  Factures
  ...
```

---

### 6. Nouvelles pages

| Page | Route | Description |
|------|-------|-------------|
| `src/pages/Biens.tsx` | `/biens` | Catalogue des biens : liste, creation, edition, filtres par statut/type |
| `src/pages/BienDetail.tsx` | `/biens/:id` | Fiche bien avec historique reservations + transactions liees |
| `src/pages/Reservations.tsx` | `/reservations` | Page reservations (bandeau stats + liste + dialog creation) |
| `src/pages/Transactions.tsx` | `/transactions` | Page transactions de vente (bandeau stats + liste + dialog creation) |

**Dialogs** :
- `src/components/dialogs/BienDialog.tsx` : creation/edition d'un bien
- `src/components/dialogs/ReservationDialog.tsx` : creation/edition reservation (select client + select bien)
- `src/components/dialogs/TransactionDialog.tsx` : creation/edition transaction de vente

---

### 7. Section Parametres -- Mode d'activite

**Modification de `src/pages/Parametres.tsx`** :

Ajouter une nouvelle section "Mode d'activite de l'agence" entre la section Entreprise et les boutons d'action :
- Switch "Vente immobiliere" (active/desactive le module Transactions)
- Switch "Location immobiliere" (active/desactive le module Reservations)
- Au moins un des deux doit rester actif (validation cote frontend)

---

### 8. Integration dans la fiche client

**Modification de `src/pages/ClientDetail.tsx`** :

Ajouter conditionnellement (selon les settings de l'agence) :
- Bloc "Reservations" : si location active, afficher les reservations du client
- Bloc "Transactions" : si vente active, afficher les transactions du client

Ces blocs s'ajoutent apres les blocs Devis et Factures existants, sans les modifier.

---

### 9. Routes dans App.tsx

Nouvelles routes protegees par `RoleProtectedRoute` avec `allowedRoles={["admin", "agent"]}` :
- `/biens`
- `/biens/:id`
- `/reservations`
- `/transactions`

---

### 10. Impact sur l'existant

| Element | Impact |
|---------|--------|
| Tables existantes | AUCUN -- aucune table modifiee |
| Factures / Revenus / Depenses | AUCUN |
| Permissions (app_permission) | AUCUN pour le MVP -- les nouvelles pages heritent des roles admin/agent |
| Dashboard | AUCUN |
| Clients | Ajout de blocs en lecture seule dans ClientDetail uniquement |
| Sidebar | Ajout d'entrees conditionnelles, aucune suppression |
| Table reservations existante | Ajout d'une colonne `property_id` nullable, champ `property_name` conserve |

---

### 11. Strategie d'integration progressive

**Phase 1** : Base de donnees
- Creer `agency_settings`, `properties`, `sales_transactions`
- Ajouter `property_id` a `reservations`
- RLS sur toutes les nouvelles tables

**Phase 2** : Hook et navigation conditionnelle
- Creer `useAgencySettings`
- Modifier `DynamicSidebar` pour le filtrage conditionnel
- Ajouter la section Mode d'activite dans Parametres

**Phase 3** : Module Biens
- Page Biens + BienDetail + BienDialog
- Routes dans App.tsx

**Phase 4** : Module Reservations
- Page Reservations + ReservationDialog
- Lien avec properties via `property_id`

**Phase 5** : Module Transactions
- Page Transactions + TransactionDialog
- Lien avec properties via `property_id`

**Phase 6** : Integration fiche client
- Blocs conditionnels Reservations et Transactions dans ClientDetail

---

### 12. Resume des fichiers

| Fichier | Action |
|---------|--------|
| Migration SQL | Creer tables + modifier reservations + RLS |
| `src/hooks/useAgencySettings.tsx` | Nouveau -- hook settings agence |
| `src/pages/Biens.tsx` | Nouveau -- catalogue biens |
| `src/pages/BienDetail.tsx` | Nouveau -- fiche bien |
| `src/pages/Reservations.tsx` | Nouveau -- gestion reservations |
| `src/pages/Transactions.tsx` | Nouveau -- gestion transactions vente |
| `src/components/dialogs/BienDialog.tsx` | Nouveau -- formulaire bien |
| `src/components/dialogs/ReservationDialog.tsx` | Nouveau -- formulaire reservation |
| `src/components/dialogs/TransactionDialog.tsx` | Nouveau -- formulaire transaction |
| `src/components/DynamicSidebar.tsx` | Modifie -- ajout entrees conditionnelles |
| `src/pages/Parametres.tsx` | Modifie -- section Mode d'activite |
| `src/pages/ClientDetail.tsx` | Modifie -- blocs conditionnels |
| `src/App.tsx` | Modifie -- ajout routes |

