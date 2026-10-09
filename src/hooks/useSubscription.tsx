import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEntreprise } from "@/hooks/useEntreprise";
import { planHasFeature, type FeatureKey } from "@/lib/pricing/features";

interface SubscriptionState {
  plan: string;
  status: string;
  billing_cycle: string;
  is_trial: boolean;
  days_left: number;
  is_active: boolean;
  is_expired: boolean;
  trial_ends_at: string | null;
  end_date: string | null;
  start_date: string | null;
}

export const useSubscription = () => {
  const { entrepriseId, isLoading: entrepriseLoading } = useEntreprise();

  const { data, isLoading: queryLoading, refetch } = useQuery({
    queryKey: ["subscription-state", entrepriseId],
    queryFn: async (): Promise<SubscriptionState | null> => {
      if (!entrepriseId) return null;
      const { data, error } = await supabase.rpc("get_subscription_state", {
        _entreprise_id: entrepriseId,
      });
      if (error) throw error;
      return data as unknown as SubscriptionState;
    },
    enabled: !!entrepriseId,
    staleTime: 60 * 1000,
  });

  const plan = data?.plan ?? "trial";
  const status = data?.status ?? "trial";
  const isTrial = data?.is_trial ?? false;
  const trialDaysLeft = data?.days_left ?? 0;
  const trialEndsAt = data?.trial_ends_at ? new Date(data.trial_ends_at) : null;
  const isActive = data?.is_active ?? true;
  const isExpired = data?.is_expired ?? false;
  const isBlocked = isExpired && !isActive;
  const isPremium = (plan === "standard" || plan === "pro") && isActive;

  const canUse = (feature: FeatureKey): boolean => {
    if (isBlocked) return false;
    if (isTrial) return true; // trial unlocks everything
    return planHasFeature(plan, feature);
  };

  return {
    plan,
    status,
    isTrial,
    trialDaysLeft,
    trialEndsAt,
    isActive,
    isExpired,
    isBlocked,
    isPremium,
    billingCycle: data?.billing_cycle ?? "monthly",
    canUse,
    refetch,
    isLoading: entrepriseLoading || queryLoading,
  };
};
