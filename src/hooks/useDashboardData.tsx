import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  const simpleQuery = useQuery({
    queryKey: ["dashboard-simple", entrepriseId],
    queryFn: async () => {
      if (!entrepriseId) return null;
      const { data, error } = await supabase
        .from("v_dashboard_simple" as any)
        .select("*")
        .eq("entreprise_id", entrepriseId)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as SimpleDashboardData | null;
    },
    enabled: !!entrepriseId,
    staleTime: 2 * 60 * 1000,
  });

  const advancedFinanceQuery = useQuery({
    queryKey: ["dashboard-advanced-finance", entrepriseId],
    queryFn: async () => {
      if (!entrepriseId) return null;
      const { data, error } = await supabase
        .from("v_dashboard_advanced_finance" as any)
        .select("*")
        .eq("entreprise_id", entrepriseId)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as AdvancedFinanceData | null;
    },
    enabled: !!entrepriseId && mode === "advanced" && isPremium,
    staleTime: 2 * 60 * 1000,
  });

  const advancedPropertyQuery = useQuery({
    queryKey: ["dashboard-advanced-property", entrepriseId],
    queryFn: async () => {
      if (!entrepriseId) return null;
      const { data, error } = await supabase
        .from("v_dashboard_advanced_property" as any)
        .select("*")
        .eq("entreprise_id", entrepriseId)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as AdvancedPropertyData | null;
    },
    enabled: !!entrepriseId && mode === "advanced" && isPremium,
    staleTime: 2 * 60 * 1000,
  });

  const alertsQuery = useQuery({
    queryKey: ["dashboard-alerts", entrepriseId],
    queryFn: async () => {
      if (!entrepriseId) return null;
      const { data, error } = await supabase
        .from("v_dashboard_alerts" as any)
        .select("*")
        .eq("entreprise_id", entrepriseId);
      if (error) throw error;
      return (data as unknown as AlertData[]) || [];
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

  const queryClient = useQueryClient();

  useEffect(() => {
    if (!entrepriseId) return;

    const channel = supabase
      .channel("dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "factures" }, () => {
        queryClient.invalidateQueries({ queryKey: ["dashboard-simple", entrepriseId] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-advanced-finance", entrepriseId] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "revenus" }, () => {
        queryClient.invalidateQueries({ queryKey: ["dashboard-simple", entrepriseId] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-advanced-finance", entrepriseId] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-top-properties", entrepriseId] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "depenses" }, () => {
        queryClient.invalidateQueries({ queryKey: ["dashboard-simple", entrepriseId] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-advanced-finance", entrepriseId] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations" }, () => {
        queryClient.invalidateQueries({ queryKey: ["dashboard-simple", entrepriseId] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-advanced-property", entrepriseId] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-alerts", entrepriseId] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [entrepriseId, queryClient]);

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
