import { useMemo } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { usePlans, type PlanFeature } from "@/hooks/usePlans";

/**
 * Accès aux fonctionnalités selon la formule de l'agence.
 *
 * La formule effective suit la règle du serveur :
 * - "trial" est traité comme "standard" (un essai débloque Standard) ;
 * - une valeur inconnue retombe sur "starter" (le plus restrictif).
 *
 * Les fonctionnalités elles-mêmes viennent de plans.features (base de données),
 * avec repli local dans usePlans. Rien n'est codé en dur ici hormis la
 * correspondance fonctionnalité -> formule minimale, qui sert uniquement à
 * formuler le message de verrouillage.
 */

export type { PlanFeature };

export const PLAN_LABELS: Record<string, string> = {
  starter: "Starter",
  standard: "Standard",
  pro: "Pro",
};

/** Formule minimale requise pour chaque fonctionnalité. */
export const FEATURE_MIN_PLAN: Record<PlanFeature, "starter" | "standard" | "pro"> = {
  ai_assistant: "standard",
  permissions: "standard",
  advanced_dashboard: "standard",
  messaging: "pro",
  advanced_ai: "pro",
  premium_dashboard: "pro",
};

/** Applique la règle serveur : trial -> standard, inconnu -> starter. */
export function normalizePlan(plan: string | null | undefined): "starter" | "standard" | "pro" {
  if (plan === "trial") return "standard";
  if (plan === "starter" || plan === "standard" || plan === "pro") return plan;
  return "starter";
}

export function usePlanAccess() {
  const { plan } = useSubscription();
  const { plans, isLoading } = usePlans();

  const effectivePlan = normalizePlan(plan);

  const features = useMemo<PlanFeature[]>(() => {
    const fromDb = plans.find((p) => p.code === effectivePlan);
    return fromDb?.features ?? [];
  }, [plans, effectivePlan]);

  const has = (feature: PlanFeature): boolean => features.includes(feature);

  /** Libellé de la formule minimale requise, pour le message de verrouillage. */
  const requiredPlanLabel = (feature: PlanFeature): string =>
    PLAN_LABELS[FEATURE_MIN_PLAN[feature]] ?? "Standard";

  /** Message standard des verrous visuels. */
  const lockMessage = (feature: PlanFeature): string =>
    `Disponible avec la formule ${requiredPlanLabel(feature)}`;

  return { effectivePlan, has, isLoading, requiredPlanLabel, lockMessage };
}
