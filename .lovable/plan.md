

## Module Reservations -- Planification technique

Module totalement independant pour la gestion des locations (jour, semaine, mois).

---

### 1. Base de donnees

**Nouvelle table `reservations`**

| Colonne | Type | Default | Description |
|---------|------|---------|-------------|
| id | uuid (PK) | gen_random_uuid() | Identifiant |
| entreprise_id | uuid | NOT NULL | Entreprise proprietaire |
| client_id | uuid | NOT NULL | Reference au client (pas de FK formelle pour ne rien modifier) |
| property_name | text | NOT NULL | Nom du bien (texte libre MVP) |
| type_location | text | NOT NULL | "jour", "semaine", "mois" |
| date_arrivee | date | NOT NULL | Date d'arrivee |
| date_depart | date | NOT NULL | Date de depart |
| prix_unitaire | numeric | 0 | Prix par unite (jour/semaine/mois) |
| montant_total | numeric | 0 | Montant total calcule |
| montant_paye | numeric | 0 | Montant deja paye |
| caution | numeric | 0 | Caution versee |
| statut | text | 'confirmee' | "en_attente", "confirmee", "en_cours", "terminee", "annulee" |
| generer_facture | boolean | false | Option de generation de facture |
| notes | text | NULL | Notes libres |
| created_at | timestamptz | now() | Date de creation |
| updated_at | timestamptz | now() | Derniere modification |

**RLS** : Memes regles role-based que les autres tables :
- Admin : acces a toutes les reservations de son entreprise
- Agent : acces aux reservations des clients qui lui sont assignes (via jointure `clients.assigned_to`)

Aucune FK formelle vers `clients` pour respecter la contrainte de ne modifier aucune table existante. La relation est geree cote application.

---

### 2. Frontend -- Fichiers a creer/modifier

**Nouveau fichier : `src/pages/Reservations.tsx`**

Structure de la page :
- Layout standard : `DynamicSidebar` + `FloatingParticles` + `h-screen flex overflow-hidden`
- Header avec bouton retour + titre "Reservations"

**Bandeau de statistiques** (4 cartes en grille) :
- Arrivees aujourd'hui : count des reservations avec `date_arrivee = today` et statut confirmee/en_cours
- Departs aujourd'hui : count des reservations avec `date_depart = today`
- Sejours en cours : count des reservations avec statut "en_cours"
- Paiements en retard : count des reservations ou `montant_paye < montant_total` et `date_depart < today` et statut terminee

**Bouton "Nouvelle reservation"** : ouvre un dialog de creation

**Liste des reservations** : tableau avec nom client, bien, dates, montant, statut, actions

**Nouveau fichier : `src/components/dialogs/ReservationDialog.tsx`**

Formulaire de creation/edition :
- Select client (charge depuis la table `clients` de l'entreprise)
- Input texte : nom du bien
- Select : type de location (jour/semaine/mois)
- DatePicker : date arrivee
- DatePicker : date depart
- Input numerique : prix unitaire
- Champ calcule automatique : montant total (nombre d'unites x prix unitaire)
- Input numerique : montant paye
- Input numerique : caution
- Select : statut
- Checkbox : "Generer facture automatiquement" (stocke le booleen, pas de logique facture pour le moment)

Le calcul automatique du montant total :
- Type jour : nombre de jours entre arrivee et depart x prix unitaire
- Type semaine : nombre de semaines (arrondi) x prix unitaire
- Type mois : nombre de mois (arrondi) x prix unitaire

---

### 3. Onglet Reservations dans la fiche client

**Fichier modifie : `src/pages/ClientDetail.tsx`**

Ajouter un troisieme bloc dans la section droite (apres Devis et Factures) :
- Icone `CalendarCheck` + titre "Reservations (X)"
- Liste des reservations du client avec : bien, dates, montant, statut
- Meme style que les blocs Devis et Factures existants

Cette modification est limitee a l'affichage en lecture seule. Aucune table existante n'est touchee.

---

### 4. Integration dans la navigation

**Fichier modifie : `src/components/DynamicSidebar.tsx`**
- Ajouter une entree apres "Clients" (ligne 35) :
  - Icone : `CalendarCheck` (lucide-react)
  - Label : "Reservations"
  - Path : `/reservations`
  - Roles : `["admin", "agent"]`

**Fichier modifie : `src/App.tsx`**
- Ajouter la route `/reservations` protegee par `RoleProtectedRoute` avec `allowedRoles={["admin", "agent"]}`
- Positionner apres la route `/clients/:id`

---

### 5. Resume des fichiers

| Fichier | Action |
|---------|--------|
| Migration SQL | Creer table `reservations` + RLS |
| `src/pages/Reservations.tsx` | Nouveau -- page principale |
| `src/components/dialogs/ReservationDialog.tsx` | Nouveau -- formulaire creation/edition |
| `src/pages/ClientDetail.tsx` | Modifie -- ajout bloc Reservations |
| `src/components/DynamicSidebar.tsx` | Modifie -- ajout entree menu |
| `src/App.tsx` | Modifie -- ajout route |

Aucune table existante modifiee. Aucun impact sur factures, revenus, depenses ou permissions.

