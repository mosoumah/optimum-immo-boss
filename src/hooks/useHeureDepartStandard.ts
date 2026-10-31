import { useQuery } from "@tanstack/react-query";
import { useEntreprise } from "@/hooks/useEntreprise";
import {
  HEURE_DEPART_STANDARD_DEFAUT,
  entrepriseSettingsTable,
  toHeureInput,
} from "@/types/entreprise";

/**
 * Heure de départ standard de l'agence (`entreprises.heure_depart_standard`).
 *
 * Mise en cache React Query (5 min) et partagée : le formulaire de réservation
 * et la page Paramètres lisent la même valeur sans multiplier les requêtes.
 * Repli sur 12:00, la valeur par défaut de la base.
 */
export const useHeureDepartStandard = (): string => {
  const { entrepriseId } = useEntreprise();

  const { data } = useQuery({
    queryKey: ["entreprise_heure_depart", entrepriseId],
    enabled: !!entrepriseId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (!entrepriseId) return null;
      const { data } = await entrepriseSettingsTable()
        .select("heure_depart_standard")
        .eq("id", entrepriseId)
        .maybeSingle();
      return data?.heure_depart_standard ?? null;
    },
  });

  return toHeureInput(data ?? HEURE_DEPART_STANDARD_DEFAUT);
};
