
# Reorganiser Top 3, Alertes et Resumer IA

## Objectif
1. Retirer "Top 3 biens du mois" et "Alertes intelligentes" du panneau accordeon du dashboard avance
2. Deplacer "Top 3 biens du mois" vers la page Biens
3. Transformer les alertes intelligentes en notifications envoyees via l'icone de notification existante
4. Garder uniquement "Resume IA du mois" dans le panneau lateral du dashboard avance

## Modifications

### 1. `src/pages/Dashboard.tsx`
- Supprimer les imports de `AdvancedTopProperties`, `AdvancedAlerts`, `Building2`, `AlertTriangle`
- Dans le panneau accordeon (lignes 386-422), retirer les `AccordionItem` pour "top-properties" et "alerts"
- Remplacer l'accordeon par un affichage direct du composant `AdvancedAISummary` (plus besoin d'accordeon avec un seul element)
- Supprimer l'import de `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent` et `Brain` (l'icone sera dans le composant AISummary)

### 2. `src/pages/Biens.tsx`
- Ajouter le composant `AdvancedTopProperties` en haut de la page, entre le header et les filtres
- Utiliser le hook `useDashboardData` pour recuperer `topProperties` (ou faire un appel RPC direct `get_top_properties`)
- Importer `useEntreprise` (deja fait), `useSubscription` et le composant `AdvancedTopProperties`
- Afficher la section uniquement si des donnees existent (au moins 1 bien avec revenus)

### 3. `src/hooks/useDashboardData.tsx`
- Aucun changement necessaire pour le hook (les alertes seront recuperees par un autre mecanisme)

### 4. Alertes vers notifications
- Les alertes intelligentes proviennent de la vue `v_dashboard_alerts` 
- Creer une logique dans `src/pages/Dashboard.tsx` (ou un hook dedie) qui, au chargement du dashboard en mode avance, recupere les alertes et les insere dans la table `notifications` si elles n'existent pas deja
- Chaque alerte sera convertie en notification avec : `type = "alerte"`, `titre = config.label`, `message = alert.detail`, `reference_id = alert.id`
- Les alertes apparaitront alors automatiquement dans le panneau de notifications via le composant `NotificationBell` existant

### 5. `src/components/NotificationBell.tsx`
- Ajouter une icone pour le type `"alerte"` dans `getNotificationIcon` : retourner un emoji alerte (ex: "⚠️")

### 6. Nettoyage
- Les fichiers `AdvancedTopProperties.tsx` et `AdvancedAlerts.tsx` restent dans le projet (AdvancedTopProperties est reutilise dans Biens, AdvancedAlerts peut etre supprime)
- Supprimer `src/components/dashboard/AdvancedAlerts.tsx` car il n'est plus utilise nulle part

## Details techniques pour les alertes vers notifications
- Au chargement du dashboard avance, on fait un `upsert` dans la table `notifications` pour chaque alerte active
- On utilise `alert.id` comme `reference_id` pour eviter les doublons
- Avant l'insertion, on verifie si une notification avec ce `reference_id` existe deja pour l'utilisateur courant

## Fichiers modifies
- `src/pages/Dashboard.tsx` - retirer Top 3 et Alertes, garder Resume IA seul
- `src/pages/Biens.tsx` - ajouter Top 3 biens du mois
- `src/components/NotificationBell.tsx` - ajouter icone pour type "alerte"
- `src/components/dashboard/AdvancedAlerts.tsx` - a supprimer

## Fichiers non modifies
- `src/components/dashboard/AdvancedTopProperties.tsx` - reutilise dans Biens
- `src/components/dashboard/AdvancedAISummary.tsx` - inchange
- `src/hooks/useDashboardData.tsx` - inchange
