# Correction visibilité mobile (preview)

## Diagnostic

J'ai testé la preview sur 390px (iPhone) :

- **Page d'accueil** : OK, s'affiche correctement.
- **Dashboard** : la carte "Revenus vs Dépenses" déborde — les onglets (Semaine/Mois/Tabs) sont coupés à droite, le FAB et l'icône chatbot recouvrent le graphique.
- **Pages internes (Clients, Devis, Factures, Dépenses, Revenus, Utilisateurs, Paramètres, Documents IA, Détail client, Détail bien, Réservations, Biens)** : **contenu invisible / décalé hors écran**. Le wrapper utilise `flex-1 ml-64 ... p-8` sans préfixe responsive — la marge gauche de 256 px et le padding 32 px poussent le contenu hors du viewport mobile.

## Cause

Le layout interne a été pensé desktop-only. La sidebar est cachée en mobile (drawer) mais le `<main>` garde `ml-64` fixe → le contenu commence à 256 px de la gauche d'un viewport de 390 px.

## Plan d'implémentation (UI/UX uniquement — aucune logique métier touchée)

### 1. Wrapper standard responsive pour pages internes

Remplacer le pattern fautif sur chaque page :

```text
AVANT : <main className="flex-1 ml-64 mesh-gradient min-h-screen p-8">
APRÈS : <main className="flex-1 lg:ml-64 mesh-gradient min-h-screen p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 pb-24 lg:pb-8">
```

- `lg:ml-64` au lieu de `ml-64` → pas de marge à gauche en mobile.
- `p-4 sm:p-6 lg:p-8` → padding progressif.
- `pt-16 lg:pt-8` → réserve l'espace du bouton hamburger fixe (sidebar mobile).
- `pb-24` → évite que le FAB / chatbot ne masquent le bas.

Et sur la `<div>` interne : remplacer `max-w-6xl mx-auto relative z-10` (OK) — pas de changement, juste vérifier qu'aucun `min-w` ou largeur fixe ne casse.

### 2. Pages à modifier (même correctif wrapper)

| Fichier | Lignes |
|---|---|
| `src/pages/Clients.tsx` | wrapper + headers internes (`p-4`, gaps, taille texte responsive) |
| `src/pages/Devis.tsx` | wrapper |
| `src/pages/Factures.tsx` | wrapper |
| `src/pages/Depenses.tsx` | wrapper |
| `src/pages/Revenus.tsx` | wrapper |
| `src/pages/Utilisateurs.tsx` | wrapper (`p-8` → responsive) |
| `src/pages/Parametres.tsx` | ajouter sidebar + wrapper responsive |
| `src/pages/DocumentsIA.tsx` | wrapper (`p-8` → responsive) |
| `src/pages/ClientDetail.tsx` | `p-8` → `p-4 sm:p-6 lg:p-8` + ajout sidebar si manquant |
| `src/pages/BienDetail.tsx` | idem |
| `src/pages/Biens.tsx` | vérifier responsive |
| `src/pages/Reservations.tsx` | vérifier responsive |

Ajustements complémentaires sur les en-têtes de page : `text-3xl` → `text-2xl sm:text-3xl`, boutons `Plus` plus compacts en mobile, tableaux scrollables horizontalement (`overflow-x-auto`).

### 3. Dashboard — fix chart card

Dans `src/components/FinancialChart.tsx` (et `SimpleChart.tsx`) :
- Ajouter `overflow-hidden` sur la carte parent.
- Onglets de période (Semaine/Mois/Tabs) : permettre `flex-wrap` + `text-xs` en mobile.
- Légende (Revenus / Dépenses) : `flex-wrap gap-2`.
- Container chart : `min-w-0` pour permettre au Recharts ResponsiveContainer de bien rétrécir.

Repositionner pour ne pas chevaucher le graphique :
- `QuickActionsFab` : déjà `bottom-24 right-4` → OK.
- `AIChatBot` FAB : vérifier qu'il est `bottom-4 right-4` et ne recouvre pas la carte ; sinon ajouter `pb-28` sur le conteneur dashboard mobile (déjà présent — vérifier).

### 4. Vérification

Après modifs, retester en preview sur 320 / 375 / 390 / 414 / 768 :
- Aucun débordement horizontal.
- Toutes les pages affichent leur contenu dès le rendu.
- Chart dashboard entièrement visible, FAB ne masque rien d'essentiel.

## Hors scope (rappel)

- Aucune table Supabase, trigger, edge function, permission, ou hook métier modifié.
- Uniquement classes Tailwind / structure JSX présentation.
