# Optimum Immo

Plateforme SaaS immobilière multi-agences (React, TypeScript, Vite, Supabase).

## Démarrage local

```sh
npm install
cp .env.example .env   # puis renseigner les variables
npm run dev
```

Variables frontend (`.env`) : `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`.

## Backend Supabase

- Projet : `bzfmlawgxewfplzmivmg`
- Migrations SQL : `supabase/migrations/`
- Edge Functions : `supabase/functions/` (IA via DeepSeek, secret `DEEPSEEK_API_KEY`)
- Secrets des fonctions : `DEEPSEEK_API_KEY`, `APP_URL`

## Build

```sh
npm run build
```
