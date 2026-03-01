

# Audit complet de l'application Optimum Immo

## 1. Bugs fonctionnels

### 1.1 Lien "Mot de passe oublie" non fonctionnel
- **Fichier** : `src/pages/Connexion.tsx` (ligne 102-103)
- Le lien "Mot de passe oublie?" est un simple `<span>` avec un `cursor-pointer` mais aucune action. Il ne fait rien au clic.
- **Correctif** : Implementer un flux de reinitialisation de mot de passe avec `supabase.auth.resetPasswordForEmail()` et creer une page `/reset-password`.

### 1.2 Liens du Footer non fonctionnels
- **Fichier** : `src/components/Footer.tsx` (lignes 12-14)
- Les liens "Mentions legales", "Confidentialite", "CGU" sont des `<span>` sans lien reel ni page associee.
- **Correctif** : Creer des pages correspondantes ou les retirer.

### 1.3 Liens de la Navbar casses
- **Fichier** : `src/components/Navbar.tsx` (lignes 24-28)
- Les ancres `#pricing` et `#about` pointent vers des sections qui n'existent pas dans `Index.tsx`. Seul `#features` existe.
- **Correctif** : Supprimer ces liens ou creer les sections correspondantes.

### 1.4 Page Utilisateurs non responsive (mobile cassee)
- **Fichier** : `src/pages/Utilisateurs.tsx` (ligne 347)
- `main` a la classe `ml-64` en dur (sans `lg:` prefix), ce qui cree un decalage permanent sur mobile ou la sidebar est cachee.
- **Correctif** : Changer `ml-64` en `lg:ml-64` comme dans les autres pages.

### 1.5 Redirection login ne respecte pas les roles
- **Fichier** : `src/pages/Connexion.tsx` (lignes 25-29 et 55)
- Apres connexion, tous les utilisateurs sont rediriges vers `/dashboard`, y compris les clients qui devraient aller vers `/portail-client`. Le `useEffect` ligne 27 fait aussi un redirect aveugle vers `/dashboard`.
- **Correctif** : Verifier le role avant de rediriger (comme mentionne dans la memoire `role-based-login-redirection`).

### 1.6 Copyright perime "2024"
- **Fichiers** : `src/components/Footer.tsx` (ligne 18), `src/pages/Inscription.tsx` (ligne 113)
- L'annee affichee est 2024 au lieu de 2026.
- **Correctif** : Utiliser `new Date().getFullYear()` ou mettre a jour manuellement.

## 2. Failles de securite

### 2.1 XSS via `previewContent` dans les factures et devis (CRITIQUE)
- **Fichiers** : `src/pages/Factures.tsx` (lignes 323, 443), `src/pages/Devis.tsx` (lignes 348, 468)
- Le contenu genere par l'IA (`previewContent`) est injecte directement dans du HTML via `document.write()` et des template literals sans aucune sanitisation : `${previewContent}`.
- Si le contenu IA contient du HTML/JS malveillant, il sera execute dans le navigateur (XSS).
- **Correctif** : Sanitiser le contenu avec une fonction d'echappement HTML ou utiliser DOMPurify.

### 2.2 XSS via les donnees entreprise/client dans le print/HTML export
- **Fichiers** : `src/pages/Factures.tsx` (lignes 281-310), `src/pages/Devis.tsx`
- Les noms, adresses, emails de l'entreprise et du client sont injectes directement dans du HTML via template literals dans `document.write()`. Un client avec un nom contenant `<script>alert('xss')</script>` pourrait executer du code.
- **Correctif** : Echapper toutes les valeurs utilisateur avant insertion dans le HTML.

### 2.3 Inscription sans validation de force du mot de passe
- **Fichier** : `src/pages/Inscription.tsx`
- Le seul controle est `minLength={6}` cote HTML. Pas de validation de complexite (majuscule, chiffre, caractere special).
- **Correctif** : Ajouter une validation Zod ou custom pour la force du mot de passe.

### 2.4 Pas de rate limiting sur les tentatives de connexion
- **Fichier** : `src/pages/Connexion.tsx`
- Aucune limite sur les tentatives de connexion echouees cote client. Supabase gere ca cote serveur mais aucun feedback utilisateur.

### 2.5 Edge functions `generate-document` avec `verify_jwt = false`
- D'apres la memoire, cette edge function est accessible publiquement sans authentification. Cela pourrait etre exploite pour generer des documents sans limite.
- **Correctif** : Reactiver la verification JWT ou ajouter un autre mecanisme de securite.

## 3. Problemes d'architecture et de qualite

### 3.1 N+1 query dans Utilisateurs
- **Fichier** : `src/pages/Utilisateurs.tsx` (lignes 117-128)
- Pour chaque profil, une requete individuelle est faite pour recuperer le role. Avec 50 utilisateurs, cela fait 51 requetes.
- **Correctif** : Utiliser une seule requete RPC ou une jointure.

### 3.2 Inscription : navigation dans le corps du composant (hors useEffect)
- **Fichier** : `src/pages/Inscription.tsx` (lignes 27-30)
- `navigate()` est appele directement dans le rendu du composant au lieu d'un `useEffect`, ce qui peut causer des warnings React.
- **Correctif** : Deplacer dans un `useEffect` comme dans `Connexion.tsx`.

## 4. Resume des correctifs prioritaires

| Priorite | Probleme | Type |
|----------|---------|------|
| CRITIQUE | XSS via previewContent dans print/export HTML | Securite |
| CRITIQUE | XSS via donnees client/entreprise dans HTML | Securite |
| HAUTE | Mot de passe oublie non fonctionnel | Bug |
| HAUTE | Redirection login ignore le role client | Bug |
| HAUTE | Edge function sans JWT | Securite |
| MOYENNE | Page Utilisateurs cassee sur mobile | Bug |
| MOYENNE | Liens Navbar casses (#pricing, #about) | Bug |
| MOYENNE | N+1 queries dans Utilisateurs | Performance |
| BASSE | Footer liens non fonctionnels | Bug |
| BASSE | Copyright 2024 | Bug |
| BASSE | Navigation hors useEffect dans Inscription | Bug |
| BASSE | Validation mot de passe faible | Securite |

## 5. Plan d'implementation

### Etape 1 : Corriger les failles XSS (Factures.tsx, Devis.tsx)
Creer une fonction utilitaire `escapeHtml()` et l'appliquer a toutes les interpolations dans `document.write()` et les exports HTML.

### Etape 2 : Implementer le flux "Mot de passe oublie"
- Ajouter un composant ForgotPassword dans Connexion.tsx
- Creer une page `/reset-password`
- Ajouter la route dans App.tsx

### Etape 3 : Corriger la redirection post-login
Verifier le role de l'utilisateur dans `Connexion.tsx` avant de rediriger (client vers `/portail-client`, admin/agent vers `/dashboard`).

### Etape 4 : Corriger le responsive de Utilisateurs.tsx
Changer `ml-64` en `lg:ml-64`.

### Etape 5 : Nettoyer les liens casses
- Supprimer `#pricing` et `#about` de la Navbar ou ajouter les sections
- Ajouter des liens fonctionnels au Footer ou les retirer

### Etape 6 : Corrections mineures
- Copyright dynamique
- Navigation dans useEffect pour Inscription
- Optimiser les queries N+1 dans Utilisateurs

