import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEntreprise } from "@/hooks/useEntreprise";

interface AgencySettings {
  id: string;
  entreprise_id: string;
  vente_enabled: boolean;
  location_enabled: boolean;
}

export const useAgencySettings = () => {
  const { entrepriseId } = useEntreprise();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["agency_settings", entrepriseId],
    queryFn: async () => {
      if (!entrepriseId) return null;

      const { data, error } = await supabase
        .from("agency_settings")
        .select("*")
        .eq("entreprise_id", entrepriseId)
        .maybeSingle();

      if (error) throw error;

      // Auto-create default settings if none exist
      if (!data) {
        const { data: newData, error: insertError } = await supabase
          .from("agency_settings")
          .insert({ entreprise_id: entrepriseId, vente_enabled: true, location_enabled: true })
          .select()
          .single();

        if (insertError) {
          // If insert fails (e.g. agent role), return defaults
          return { id: "", entreprise_id: entrepriseId, vente_enabled: true, location_enabled: true } as AgencySettings;
        }
        return newData as AgencySettings;
      }

      return data as AgencySettings;
    },
    enabled: !!entrepriseId,
    staleTime: 5 * 60 * 1000,
  });

  const updateSettings = useMutation({
    mutationFn: async (updates: { vente_enabled?: boolean; location_enabled?: boolean }) => {
      if (!entrepriseId) throw new Error("No entreprise");

      const { error } = await supabase
        .from("agency_settings")
        .update(updates)
        .eq("entreprise_id", entrepriseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agency_settings", entrepriseId] });
    },
  });

  return {
    venteEnabled: settings?.vente_enabled ?? true,
    locationEnabled: settings?.location_enabled ?? true,
    isLoading,
    updateSettings,
  };
};
