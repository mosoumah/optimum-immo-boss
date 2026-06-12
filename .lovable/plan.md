
# Refonte Mobile Premium — Optimum Immo

Objectif : transformer l'expérience mobile (≤768px) en une vraie app native premium, sans toucher aux tables, triggers, edge functions, permissions ni logique métier. Uniquement présentation (JSX/CSS/Tailwind/Framer).

## Périmètre

- Cible primaire : `src/pages/Dashboard.tsx` + composants `src/components/dashboard/*`
- Cible secondaire : header mobile, chatbot flottant, sidebar mobile, NotificationBell/MessageBell, conteneur de scroll
- Pas de changement : hooks de données (`useDashboardData`, `useAuth`...), dialogs, RPC, RLS, Supabase

## 1. Conteneur & Scroll mobile

Dashboard.tsx
- Sur mobile : remplacer `h-screen overflow-hidden` par `min-h-screen overflow-y-auto` (les contraintes desktop restent via breakpoints lg).
- Ajouter safe-area iOS : `pb-[env(safe-area-inset-bottom)]`.
- Padding mobile généreux : `px-4 py-3`, espacement vertical `gap-4` entre sections.
- Aucun élément ne doit forcer une largeur > viewport : ajouter `min-w-0` et `overflow-hidden` sur conteneurs flex/grid concernés.

## 2. Header mobile compact

- Hauteur réduite (~56px), sticky top avec glassmorphism (`backdrop-blur-xl bg-background/70 border-b border-border/30`).
- Contenu mobile : [hamburger (déjà fourni par DynamicSidebar) — espace — Salutation courte "Bonjour Mohamed 👋" — NotificationBell + MessageBell].
- Sous-titre "Voici un aperçu…" masqué en mobile (`hidden sm:block`).
- Cibles tactiles 44×44 min pour cloches (ajuster les classes des bells si besoin, visuel uniquement).

## 3. Actions rapides — FAB mobile (Solution B)

- Sur mobile uniquement, masquer la barre de boutons actuelle (`hidden sm:flex`).
- Nouveau composant présentationnel `src/components/dashboard/QuickActionsFab.tsx` :
  - Bouton flottant rond (56px), `fixed bottom-20 right-4 z-40`, gradient lime + glow.
  - Tap → menu radial/bottom-sheet (Sheet shadcn) listant les mêmes actions déjà calculées par `getQuickActions()` dans Dashboard (passées en props).
  - Les `onClick` existants restent inchangés (ouvrent les mêmes dialogs).
- Desktop : conserver la grille de boutons actuelle.

## 4. KPI Cards mobile

`SimpleFinanceSummary` + `SimpleDailyActivity`
- Grille mobile : `grid-cols-2` strict, `gap-3`.
- Hauteur uniforme (`min-h-[110px]`), padding `p-4`, coins `rounded-2xl`.
- Typo : label `text-xs uppercase tracking-wide`, valeur `text-xl font-bold` ; troncature intelligente (formatter compact GNF si > 1M : `6,2M GNF`).
- Icône en haut-droite dans pastille colorée (44×44).
- Ordre logique mobile : Revenus, Dépenses, Bénéfice, Impayés, puis Arrivées, Départs, Séjours, Paiements attendus.

## 5. Graphique mobile

`SimpleChart`
- Pleine largeur, hauteur fixe `h-[240px]` en mobile.
- Réduire la densité : marges Recharts compactes, ticks axe X au format court (déjà côté présentation FinancialChart — uniquement props/CSS).
- Légende sous le graphique en mobile, dots simplifiés.

## 6. Clients récents — Cartes mobiles

- En mobile, transformer la liste en cartes empilées (`flex flex-col gap-2`) :
  - Avatar initiale, Nom (bold), téléphone/email (muted), badge statut si dispo.
  - Bouton "Voir détail" pleine largeur en bas de carte (44px), pas de hover-only.
- Conserver le rendu actuel desktop.

## 7. Chatbot flottant (`AIChatBot`)

- Bouton flottant mobile : 52px (au lieu de plus gros), `bottom-4 right-4`, glassmorphism (`backdrop-blur-xl bg-primary/20 border border-primary/30 shadow-glow-sm`).
- Décaler le FAB Quick Actions au-dessus (`bottom-20`) pour ne pas se chevaucher.
- Panneau ouvert : full-screen mobile (sheet bottom 90vh) au lieu de carte fixe qui masque le contenu.
- Aucune modification de logique chat — seulement layout/positions.

## 8. Sidebar mobile (DynamicSidebar)

- Déjà drawer overlay ✅ — petits ajustements :
  - Largeur `w-[85vw] max-w-sm`.
  - Ajouter swipe-to-close (simple : tap overlay déjà OK ; on garde).
  - Hamburger : déplacer dans le header sticky (au lieu de `fixed top-4 left-4`) pour cohérence et éviter superposition avec contenu.

## 9. NotificationBell / MessageBell

- Garantir min 44×44, badge bien lisible (≥16px, contraste accentué).
- Uniquement classes ; pas de changement de logique de comptage.

## 10. Performance présentation

- `motion.div` listes : `viewport={{ once: true }}` (déjà partiellement) + réduire les `delay` cascade sur mobile.
- Réduire `FloatingParticles count` à 12 sur mobile (prop conditionnelle via `useIsMobile`).
- `will-change` retiré des éléments non animés ; vérifier qu'aucune animation infinie n'est sur des éléments hors viewport.

## 11. Responsive QA

Breakpoints à tester visuellement : 320, 375, 390, 414, 768.
- Aucun scroll horizontal (`overflow-x-hidden` sur `body`/root si nécessaire — via `index.css`).
- Pas de texte coupé : `break-words` sur valeurs longues GNF.
- Pas de carte cassée : tester avec et sans données.

## Détails techniques

Fichiers modifiés :
- `src/pages/Dashboard.tsx` — conteneur scrollable mobile, header compact, intégration FAB, masquer barre actions en mobile.
- `src/components/dashboard/SimpleFinanceSummary.tsx` — grille 2 cols mobile, typo, formatter compact.
- `src/components/dashboard/SimpleDailyActivity.tsx` — idem.
- `src/components/dashboard/SimpleChart.tsx` — hauteur mobile, densité.
- `src/components/DynamicSidebar.tsx` — largeur mobile, hamburger dans flux header.
- `src/components/chat/AIChatBot.tsx` — taille bouton mobile, sheet plein écran.
- `src/components/NotificationBell.tsx` / `MessageBell.tsx` — tailles tactiles.
- `src/components/FloatingParticles.tsx` — count adaptatif mobile (prop).
- `src/index.css` — `overflow-x: hidden` global, utilitaire `.safe-bottom`.

Fichiers créés :
- `src/components/dashboard/QuickActionsFab.tsx` — bouton flottant + Sheet d'actions (présentation pure, reçoit `actions: {label, icon, onClick}[]`).

Aucune modification :
- Hooks (`useDashboardData`, `useAuth`, `useUserRole`, `useEntreprise`, `usePermissions`...)
- Dialogs (`ClientDialog`, `FactureDialog`, etc.)
- Supabase (tables, RLS, triggers, edge functions)
- Routes, permissions, rôles

## Hors scope (à confirmer si souhaité plus tard)

- Pages Clients/Biens/Réservations/Factures/Devis/Dépenses/Tâches : mêmes principes responsive applicables dans un second lot.
- Documents IA, Paramètres : second lot.

