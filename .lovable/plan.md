

# Reorganisation du header du Dashboard

## Objectif
Supprimer la barre de recherche du header et deplacer les icones (notification + avatar) dans la ligne du titre "Bonjour, Mohamed", a droite. Cela libere de l'espace vertical en supprimant le header entierement.

## Modifications (fichier unique : `src/pages/Dashboard.tsx`)

### 1. Supprimer le header complet (lignes 164-191)
Retirer tout le bloc `<header>` qui contient la barre de recherche, le NotificationBell et l'avatar. Cela supprime la barre de recherche et les icones de leur position actuelle.

### 2. Deplacer les icones dans la ligne du titre (lignes 195-209)
Dans le bloc "Header Section" qui affiche "Bonjour, Mohamed", ajouter les icones NotificationBell et avatar a droite du titre, dans le `flex items-center justify-between` existant (ligne 201).

Le resultat sera :
- A gauche : "Bonjour, Mohamed" + sous-titre
- A droite : icone notification + avatar initiales

### 3. Nettoyer les imports inutiles
Retirer `Search` de lucide-react et `Input` des imports (plus utilises nulle part dans ce fichier).

### Ce qui ne change PAS
- Les quick actions, KPI, graphique, clients recents
- La sidebar, les dialogs
- Toutes les autres pages

