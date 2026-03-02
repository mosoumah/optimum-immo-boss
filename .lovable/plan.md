

# Simplification du Dashboard

## Objectif
Supprimer le mode Avance (toggle Simple/Avance), supprimer le composant "Resume IA du mois", et ne garder que le dashboard Simple avec le panneau "Clients recents" a la place du Resume IA. Rien d'autre ne sera modifie.

## Modifications

### Fichier : `src/pages/Dashboard.tsx`

1. **Supprimer les imports inutiles** : `AdvancedAISummary`, `PremiumUpgradeCard`, `LayoutDashboard`, `Zap`, `useSubscription`
2. **Supprimer le state `dashboardMode`** et la fonction `handleModeChange` (lignes 70-78)
3. **Supprimer le toggle Simple/Avance** dans le header (lignes 262-291)
4. **Supprimer le `useEffect` de synchronisation d'alertes** (lignes 130-163) qui depend du mode avance
5. **Simplifier l'appel `useDashboardData`** : passer toujours `"simple"` comme mode, et `false` pour isPremium (plus besoin)
6. **Supprimer tout le bloc conditionnel avance** (lignes 403-434) : le bloc `else if (advanced)` et le `else` (PremiumUpgradeCard)
7. **Garder uniquement le bloc Simple** (lignes 326-402) qui contient deja les "Clients recents" — ce bloc devient le seul rendu du dashboard, sans condition

### Fichiers a ne PAS supprimer (mais qui ne seront plus utilises depuis le Dashboard)
- `src/components/dashboard/AdvancedAISummary.tsx` — reste dans le projet au cas ou, mais n'est plus importe
- `src/components/dashboard/PremiumUpgradeCard.tsx` — idem
- `supabase/functions/dashboard-ai-summary/index.ts` — l'edge function reste deployee mais n'est plus appelee

### Ce qui ne change PAS
- Le panneau "Clients recents" (deja present en mode Simple)
- Les KPI financiers et l'activite du jour
- Le graphique
- Les actions rapides
- La sidebar, le header, les dialogs
- Toutes les autres pages

