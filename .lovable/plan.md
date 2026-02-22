
# Redesign du graphique Revenus vs Depenses

## Inspiration de l'image de reference
L'image montre une structure en deux parties :
- **Gauche** : Un gros montant total avec un pourcentage de variation par rapport a la periode precedente
- **Droite** : Un graphique en courbes (line chart) avec tooltip detaille comparant mois actuel vs mois precedent

## Adaptation a notre thematique

Le composant `FinancialChart` sera transforme pour adopter cette structure tout en gardant la charte graphique dark/lime :

### Layout
- **Colonne gauche (1/3)** : Benefice total du mois (Revenus - Depenses), affiche en gros avec variation en % vs mois precedent (fleche verte/rouge)
- **Colonne droite (2/3)** : Graphique en **courbes** (LineChart) avec deux lignes : Revenus (vert/success) et Depenses (rouge/destructive), remplacant le BarChart actuel

### Donnees supplementaires
- Calcul du benefice = totalRevenus - totalDepenses
- Recuperation des donnees du mois precedent pour calculer la variation en %
- Affichage du tooltip style reference : date + montant revenus ce mois + montant mois precedent

### Elements visuels
- Courbes fluides avec `type="monotone"` et traits en pointilles pour le mois precedent (si disponible)
- Gros chiffre du benefice formate (ex: "12.5M GNF")
- Badge de variation avec icone TrendingUp/TrendingDown et pourcentage colore
- Suppression de la legende en bas (remplacee par les indicateurs dans le tooltip et la colonne gauche)
- Conservation des boutons Semaine/Mois

## Modifications techniques

### Fichier unique : `src/components/FinancialChart.tsx`
1. Remplacer `BarChart` + `Bar` par `LineChart` + `Line` (imports recharts)
2. Ajouter une requete pour les donnees du mois precedent dans le useEffect
3. Restructurer le JSX : layout en flex row avec colonne gauche (benefice + variation) et colonne droite (LineChart)
4. Mettre a jour le CustomTooltip pour afficher "ce mois" vs "mois precedent"
5. Supprimer le footer avec la legende TrendingUp/TrendingDown

### Aucun autre fichier modifie
`SimpleChart.tsx` et `Dashboard.tsx` restent inchanges.
