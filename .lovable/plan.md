

# Restructuration de la colonne droite du Dashboard Avance

## Objectif
Remplacer le panneau "Clients recents" par 3 widgets compacts sous forme d'accordeon (cliquables pour voir le contenu), et rendre le dashboard non-defilant.

## Ce qui change

### 1. Colonne droite : Accordeon compact
Les 3 widgets (Top 3 biens, Alertes, Resume IA) seront affiches dans un **accordeon Radix** (deja installe dans le projet). Chaque widget affiche uniquement son titre avec une icone. Au clic, il s'ouvre pour reveler son contenu, et les autres se referment automatiquement.

Visuellement, cela ressemble a :
- **[icone] Top 3 biens du mois** (cliquer pour ouvrir)
- **[icone] Alertes intelligentes** (cliquer pour ouvrir)
- **[icone] Resume IA du mois** (cliquer pour ouvrir)

Tout tient dans l'espace du panneau "Clients recents" actuel, sans debordement.

### 2. Suppression des sections en dessous du graphique
Pour que le dashboard ne defile pas, les sections "Finances detaillees" (AdvancedFinanceDetails) et "Indicateurs immobiliers" (AdvancedPropertyMetrics) seront retirees du mode avance. Ces donnees restent accessibles via les pages dediees (Revenus, Depenses, Biens).

### 3. Dashboard non-defilant
Le conteneur principal utilisera `overflow-hidden` au lieu de `overflow-y-auto` pour le mode avance, garantissant zero defilement.

## Structure finale du mode Avance

1. Resume financier (4 KPI en ligne)
2. Activite du jour (3 indicateurs)
3. Graphique Revenus vs Depenses (2/3) + Accordeon compact (1/3)

Tout visible sans aucun defilement.

## Details techniques

### Fichier : `src/pages/Dashboard.tsx`
- Lignes 379-383 : remplacer les 3 composants empiles par un unique composant `Accordion` de Radix avec 3 `AccordionItem`
- Chaque item integre le contenu de `AdvancedTopProperties`, `AdvancedAlerts` et `AdvancedAISummary` respectivement
- Lignes 386-394 : supprimer les separateurs et les sections `AdvancedFinanceDetails` et `AdvancedPropertyMetrics`
- Le mode avance se termine apres la grille graphique+accordeon

### Imports a ajouter
- `Accordion, AccordionItem, AccordionTrigger, AccordionContent` depuis `@/components/ui/accordion`
- `ChevronDown` depuis `lucide-react` (deja gere par le composant accordion)

### Aucune modification de base de donnees
Pas de nouveau composant, pas de migration SQL.

