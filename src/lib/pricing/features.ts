import type { PlanId } from "./plans";

export type FeatureKey =
  | "ai_assistant"
  | "unlimited_factures"
  | "messaging"
  | "advanced_dashboard"
  | "permissions"
  | "create_bien"
  | "create_reservation"
  | "create_facture";

// Features available per paid plan.
// During trial (or active status), all features are enabled.
const PLAN_FEATURES: Record<PlanId, FeatureKey[]> = {
  starter: ["create_bien", "create_reservation", "create_facture"],
  standard: [
    "create_bien",
    "create_reservation",
    "create_facture",
    "ai_assistant",
    "permissions",
    "advanced_dashboard",
  ],
  pro: [
    "create_bien",
    "create_reservation",
    "create_facture",
    "ai_assistant",
    "permissions",
    "advanced_dashboard",
    "messaging",
    "unlimited_factures",
  ],
};

export function planHasFeature(plan: string | undefined | null, feature: FeatureKey): boolean {
  if (!plan) return false;
  const p = plan as PlanId;
  return PLAN_FEATURES[p]?.includes(feature) ?? false;
}
