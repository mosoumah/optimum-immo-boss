import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEntreprise } from "@/hooks/useEntreprise";

interface SubscriptionData {
  plan: string;
  status: string;
  end_date: string | null;
  start_date: string | null;
  payment_reference: string | null;
}

export const useSubscription = () => {
  const { entrepriseId, isLoading: entrepriseLoading } = useEntreprise();

  const { data, isLoading: queryLoading } = useQuery({
    queryKey: ["subscription", entrepriseId],
    queryFn: async () => {
      if (!entrepriseId) return null;
      const { data, error } = await supabase
        .from("subscriptions")
        .select("plan, status, end_date, start_date, payment_reference")
        .eq("entreprise_id", entrepriseId)
        .maybeSingle();
      if (error) throw error;
      return data as SubscriptionData | null;
    },
    enabled: !!entrepriseId,
    staleTime: 5 * 60 * 1000,
  });

  const plan = data?.plan || "standard";
  const status = data?.status || "active";
  const endDate = data?.end_date ? new Date(data.end_date) : null;
  const isActive = status === "active" && (!endDate || endDate > new Date());
  const isPremium = plan === "premium" && isActive;
  const isExpired = status === "expired" || (endDate !== null && endDate <= new Date());

  return {
    plan,
    status,
    isPremium,
    isActive,
    isExpired,
    isLoading: entrepriseLoading || queryLoading,
  };
};
