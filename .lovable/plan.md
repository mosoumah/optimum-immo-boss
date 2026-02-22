
# Restructuration du Dashboard Avance

## Ce qui change

### Dans la zone a droite du graphique (a la place de "Clients recents")
Remplacer le bloc "Clients recents" par 3 widgets empiles :
1. **Top 3 biens du mois** (AdvancedTopProperties)
2. **Alertes intelligentes** (AdvancedAlerts)
3. **Resume IA** (AdvancedAISummary)

### Sections supprimees
- **Clients recents** : retire du dashboard avance (reste dans le mode simple)
- **Analyse par type** (AdvancedFinancialChartWrapper) : supprime du dashboard avance

### Sections conservees (inchangees)
- Resume financier (SimpleFinanceSummary)
- Activite du jour (SimpleDailyActivity)
- Graphique Revenus vs Depenses (SimpleChart, occupe 2/3 de la largeur)
- Finances detaillees (AdvancedFinanceDetails)
- Indicateurs immobiliers (AdvancedPropertyMetrics)

## Structure finale du mode Avance

1. Resume financier
2. Activite du jour
3. **Graphique Revenus vs Depenses (2/3)** + **Top 3 biens + Alertes + Resume IA (1/3, empiles)**
4. Finances detaillees (6 KPI)
5. Indicateurs immobiliers

## Modifications techniques

### `src/pages/Dashboard.tsx`
- Lignes 372-428 (bloc advanced grid) : remplacer le panneau "Clients recents" par les 3 composants AdvancedTopProperties, AdvancedAlerts et AdvancedAISummary empiles dans la colonne droite
- Lignes 442-456 : supprimer le grid Top 3 + Alertes, le AdvancedFinancialChartWrapper et le AdvancedAISummary (car ils sont maintenant integres dans la colonne droite)
- Supprimer les separateurs associes aux sections retirees
