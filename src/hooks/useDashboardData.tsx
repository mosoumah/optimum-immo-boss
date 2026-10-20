import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePlanAccess } from "@/hooks/usePlanAccess";
import type { Database } from "@/integrations/supabase/types";

// Use a simple typed wrapper to avoid 'as any' on view names
function fromView<V extends keyof Database["public"]["Views"]>(view: V) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from(view);
}

export interface SimpleDashboardData {
  revenus_mois: number;
  depenses_mois: number;
  benefice_estime: number;
  factures_impayees: number;
  arrivees_aujourdhui: number;
  departs_aujourdhui: number;
  taches_urgentes: number;
  paiements_attendus: number;
  sejours_en_cours: number;
}

export interface AdvancedFinanceData {
  revenus_court_sejour: number;
  revenus_mensuel: number;
  revenus_vente: number;
  depenses_totales: number;
  benefice_net: number;
  loyers_en_retard: number;
}

export interface AdvancedPropertyData {
  biens_total: number;
  biens_disponibles: number;
  biens_occupes: number;
  taux_occupation: number;
  reservations_en_cours: number;
}

export interface AlertData {
  id: string;
  alert_type: string;
  label: string | null;
  detail: string | null;
}

export interface TopPropertyData {
  property_name: string;
  total_revenue: number;
}

export const useDashboardData = (
  entrepriseId: string | null,
  mode: "simple" | "advanced",
  isPremium: boolean
) => {
  const { has, isLoading: planLoading } = usePlanAccess();
  // Blocs avances (vues v_dashboard_advanced_* uniquement) : reserves aux
  // formules incluant 'advanced_dashboard'. Pendant le chargement des formules,
  // aucune requete avancee n'est lancee (ni verrou, ni faux positif).
  const advancedAllowed = !planLoading && has("advanced_dashboard");

  const simpleQuery = useQuery({
    queryKey: ["dashboard-simple", entrepriseId],
    queryFn: async () => {
      if (!entrepriseId) return null;
      const { data, error } = await fromView("v_dashboard_simple")
        .select("*")
        .eq("entreprise_id", entrepriseId)
        .maybeSingle();
      if (error) throw error;
      return data as SimpleDashboardData | null;
    },
    enabled: !!entrepriseId,
    staleTime: 2 * 60 * 1000,
  });

  const advancedFinanceQuery = useQuery({
    queryKey: ["dashboard-advanced-finance", entrepriseId],
    queryFn: async () => {
      if (!entrepriseId) return null;
      const { data, error } = await fromView("v_dashboard_advanced_finance")
        .select("*")
        .eq("entreprise_id", entrepriseId)
        .maybeSingle();
      if (error) throw error;
      return data as AdvancedFinanceData | null;
    },
    enabled: !!entrepriseId && mode === "advanced" && isPremium && advancedAllowed,
    staleTime: 2 * 60 * 1000,
  });

  const advancedPropertyQuery = useQuery({
    queryKey: ["dashboard-advanced-property", entrepriseId],
    queryFn: async () => {
      if (!entrepriseId) return null;
      const { data, error } = await fromView("v_dashboard_advanced_property")
        .select("*")
        .eq("entreprise_id", entrepriseId)
        .maybeSingle();
      if (error) throw error;
      return data as AdvancedPropertyData | null;
    },
    enabled: !!entrepriseId && mode === "advanced" && isPremium && advancedAllowed,
    staleTime: 2 * 60 * 1000,
  });

  const alertsQuery = useQuery({
    queryKey: ["dashboard-alerts", entrepriseId],
    queryFn: async () => {
      if (!entrepriseId) return null;
      const { data, error } = await fromView("v_dashboard_alerts")
        .select("*")
        .eq("entreprise_id", entrepriseId);
      if (error) throw error;
      return (data as AlertData[]) || [];
    },
    enabled: !!entrepriseId && mode === "advanced" && isPremium,
    staleTime: 2 * 60 * 1000,
  });

  const topPropertiesQuery = useQuery({
    queryKey: ["dashboard-top-properties", entrepriseId],
    queryFn: async () => {
      if (!entrepriseId) return [];
      const { data, error } = await supabase.rpc("get_top_properties", {
        _entreprise_id: entrepriseId,
      });
      if (error) throw error;
      return (data as unknown as TopPropertyData[]) || [];
    },
    enabled: !!entrepriseId && mode === "advanced" && isPremium,
    staleTime: 2 * 60 * 1000,
  });

  // Le temps réel est géré par l'écran qui utilise ce hook (useRealtimeRefresh) :
  // il invalide les mêmes clés de requête, avec un canal unique et un anti-rebond.
  // Un abonnement ici créerait un second canal pour les mêmes tables.

  return {
    simple: simpleQuery.data || null,
    advancedFinance: advancedFinanceQuery.data || null,
    advancedProperty: advancedPropertyQuery.data || null,
    alerts: alertsQuery.data || [],
    topProperties: topPropertiesQuery.data || [],
    isLoading:
      mode === "simple"
        ? simpleQuery.isLoading
        : advancedFinanceQuery.isLoading ||
          advancedPropertyQuery.isLoading ||
          alertsQuery.isLoading ||
          topPropertiesQuery.isLoading,
  };
};
