## Problème

Deux problèmes distincts dans le déploiement Hostinger :

### 1. Conflit de dépendances npm (ERESOLVE)
`package.json` déclare `vite@^8.0.13`, mais `@vitejs/plugin-react-swc@^3.11.0` n'accepte que `vite@^4 || ^5 || ^6 || ^7`. Hostinger installe donc avec `--legacy-peer-deps` (le build "passe" en local mais reste fragile, et certains hébergeurs refusent carrément l'install).

### 2. Page blanche après déploiement
Même quand le build réussit (`dist/` est bien généré), Hostinger sert un SPA React Router sans fichier `.htaccess`. Résultat : la racine peut fonctionner mais toutes les routes (`/dashboard`, `/connexion`, refresh…) renvoient 404 ou page blanche, et les assets sont parfois mal résolus.

## Plan

### A. Aligner Vite avec le plugin SWC
- `package.json` : remplacer `"vite": "^8.0.13"` par `"vite": "^5.4.19"` (version stable, compatible plugin-react-swc 3.x, déjà utilisée par tous les autres projets Lovable).
- Garder `@vitejs/plugin-react-swc@^3.11.0` tel quel.
- `vite.config.ts` : aucune modification nécessaire (l'API utilisée est compatible Vite 5).

### B. Ajouter le fallback SPA pour Hostinger
- Créer `public/.htaccess` avec :
  - Rewrite vers `index.html` pour toute route inexistante (SPA fallback)
  - Compression gzip
  - Cache long pour `/assets/*` (fichiers hashés)
  - Headers de sécurité basiques (cohérents avec ceux déjà définis dans `vite.config.ts`)

Vite copie automatiquement `public/.htaccess` dans `dist/` au build.

### C. Push GitHub
La sync GitHub de Lovable est bidirectionnelle et automatique : dès que les modifs sont appliquées dans Lovable, elles sont poussées sur le repo connecté. Aucune action manuelle requise — il suffit que le projet soit déjà connecté à GitHub (sinon : menu + → GitHub → Connect project).

## Étapes de déploiement Hostinger (après le fix)

1. `npm install` (sans `--legacy-peer-deps`, ça doit passer proprement)
2. `npm run build`
3. Uploader **le contenu de `dist/`** (pas le dossier lui-même) dans `public_html/`
4. Vérifier que `.htaccess` est bien présent dans `public_html/`

## Note sur l'avertissement "chunks > 500 ko"
C'est un simple warning, pas une erreur — le bundle principal fait 2 Mo (579 ko gzip), ça reste acceptable. Pas inclus dans ce fix (hors scope demandé).
