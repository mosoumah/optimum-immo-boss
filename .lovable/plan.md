# Refonte Premium — Landing Page `/`

Direction visuelle verrouillée : **Noir & Lime** (cohérent avec le dashboard), typo **Instrument Serif × Work Sans**, structure **Hero immersif + Bento grid**.

## Direction créative

- **Couleurs** : fond `#0a0a0a`, surfaces `#141414`, accent lime `#d4ff3a`, secondaire vert `#22c55e`, texte ivoire `#f5f5f0` / muted `#8a8a85`.
- **Typographie** : titres en *Instrument Serif* (italique sur mots-clés "agence", "immobilier"), corps en *Work Sans*. Tailles hero jusqu'à `clamp(3.5rem, 8vw, 7rem)`, tracking serré sur display.
- **Texture** : grain subtil, halos lime radiaux, lignes fines `border-white/5`, glassmorphism léger sur cartes.
- **Motion** : Framer Motion — fade-up séquentiel, parallaxe douce sur hero, hover tilt sur bento, ligne lime qui se trace sous les titres, compteur animé sur stats.

## Structure de la page

1. **Navbar** repensée : logo + liens minimaux + CTA lime pill, blur backdrop.
2. **Hero éditorial**
   - Eyebrow lime `• Plateforme immobilière nouvelle génération`
   - Titre serif XXL avec mots en italique lime
   - Sous-titre Work Sans, max 60ch
   - Double CTA (lime solide + outline) + indicateur scroll
   - Mockup dashboard flottant (image fournie) avec glow lime, légèrement incliné
3. **Bande de stats / preuve sociale** : 4 chiffres animés (agences, biens gérés, factures, satisfaction).
4. **Bento grid features (6 cellules asymétriques)**
   - Grande cellule : Tableau de bord temps réel (preview chart)
   - Gestion clients · Facturation · Réservations · Biens · Tâches IA
   - Tailles variées (2x1, 1x1, 1x2), accents lime ponctuels, icônes Lucide en lime sur fond `#141414`.
5. **Section "Comment ça marche"** : 3 étapes numérotées style éditorial, ligne verticale lime.
6. **Section bénéfices** : 4 cartes minimales (gain de temps, économies, données, distinction) avec icônes outline.
7. **Témoignage / citation** pleine largeur, serif italique géant, attribution discrète.
8. **CTA final** : carte noire bordée lime, halo, double bouton.
9. **Footer** premium : colonnes liens, logo, mention conformité.

## Détails techniques

- **Fichiers modifiés**
  - `src/pages/Index.tsx` — refonte complète avec nouvelles sections.
  - `src/components/Navbar.tsx` — variante premium dark.
  - `src/components/Footer.tsx` — version enrichie.
  - `src/components/FeatureCard.tsx` — variantes bento (size: sm/md/lg).
  - `src/index.css` — ajout tokens : `--lime`, `--lime-glow`, gradients, `bg-grain`, `shadow-lime`.
  - `tailwind.config.ts` — `fontFamily.display: ['"Instrument Serif"', 'serif']`, `fontFamily.sans: ['"Work Sans"', ...]`, couleur `lime`.
- **Fonts** : `bun add @fontsource/instrument-serif @fontsource/work-sans`, imports dans `src/main.tsx`.
- **Image dashboard** : utiliser la capture jointe via `lovable-assets create` puis import comme mockup hero.
- **Aucune logique backend modifiée**, uniquement présentationnel.
- Pages internes (dashboard, etc.) non touchées — palette dashboard déjà cohérente.

## Hors scope

- Pas de modification du dashboard, des dialogs, du chatbot, ni du backend.
- Pas de nouvelle route, pas de nouvelles fonctionnalités produit.
- SEO basique conservé (titre/meta existants), non refondu sauf si demandé.
