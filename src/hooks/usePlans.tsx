import { useEffect, useState } from "react";
import { PLANS, type Plan } from "@/lib/pricing/plans";
import { plansTable, type PlanRow, type BillingCycleParam } from "@/types/billing";

/** Fonctionnalités pilotées par la formule, telles que stockées dans plans.features. */
export type PlanFeature =
  | "ai_assistant"
  | "permissions"
  | "advanced_dashboard"
  | "messaging"
  | "advanced_ai"
  | "premium_dashboard";

/**
 * Repli local si plans.features est indisponible (table illisible ou vide).
 * Reproduit exactement la répartition décrite par le serveur.
 */
const FALLBACK_FEATURES: Record<string, PlanFeature[]> = {
  starter: [],
  standard: ["ai_assistant", "permissions", "advanced_dashboard"],
  pro: [
    "ai_assistant",
    "permissions",
    "advanced_dashboard",
    "messaging",
    "advanced_ai",
    "premium_dashboard",
  ],
};

export interface PlanPrice {
  code: string;
  nom: string;
  /** Prix mensuel en GNF (base si disponible, sinon constante locale). */
  monthly: number;
  /** Prix annuel en GNF — lu dans plans.prix_annuel_gnf, jamais calculé en dur. */
  annual: number;
  maxUtilisateurs: number | null;
  maxFacturesParMois: number | null;
  /** Fonctionnalités incluses (plans.features, ou repli local). */
  features: PlanFeature[];
  /** Champs d'affichage issus des constantes locales (emoji, accroche, features). */
  meta: Plan | undefined;
  /** Vrai si la ligne provient de public.plans. */
  fromDatabase: boolean;
}

const toFeatureList = (raw: unknown, code: string): PlanFeature[] => {
  if (Array.isArray(raw)) {
    return raw.filter((v): v is PlanFeature => typeof v === "string") as PlanFeature[];
  }
  return FALLBACK_FEATURES[code] ?? [];
};

/**
 * Lit les formules depuis public.plans, avec repli sur les constantes locales
 * (PLANS) si la lecture échoue ou renvoie une table vide : l'affichage ne casse
 * jamais. Utilisé par la page Abonnement et par la page Tarifs pour garantir
 * des prix identiques.
 */
export function usePlans() {
  const [rows, setRows] = useState<PlanRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const { data, error } = await plansTable()
          .select(
            "code, nom, prix_mensuel_gnf, prix_annuel_gnf, max_utilisateurs, max_factures_par_mois, features, actif",
          )
          .eq("actif", true)
          .order("prix_mensuel_gnf", { ascending: true });
        if (error) throw error;
        if (active && data && data.length > 0) setRows(data);
      } catch {
        // Repli silencieux : les constantes locales prennent le relais.
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const plans: PlanPrice[] = rows.length
    ? rows.map((r) => {
        const monthly = Number(r.prix_mensuel_gnf);
        return {
          code: r.code,
          nom: r.nom,
          monthly,
          // prix_annuel_gnf vient de la base ; on ne calcule jamais x10 en dur.
          annual: Number(r.prix_annuel_gnf),
          maxUtilisateurs: r.max_utilisateurs,
          maxFacturesParMois: r.max_factures_par_mois,
          features: toFeatureList(r.features, r.code),
          meta: PLANS.find((p) => p.id === r.code),
          fromDatabase: true,
        };
      })
    : PLANS.map((p) => ({
        code: p.id,
        nom: p.name,
        monthly: p.priceMonthly,
        annual: p.priceYearly,
        maxUtilisateurs: p.id === "starter" ? 2 : p.id === "standard" ? 5 : null,
        maxFacturesParMois: p.id === "starter" ? 100 : p.id === "standard" ? 500 : null,
        features: FALLBACK_FEATURES[p.id] ?? [],
        meta: p,
        fromDatabase: false,
      }));

  return { plans, isLoading };
}

/** Convertit le cycle de l'interface ("yearly") vers le parametre attendu ("annual"). */
export function toCycleParam(cycle: "monthly" | "yearly"): BillingCycleParam {
  return cycle === "yearly" ? "annual" : "monthly";
}

/** Convertit un parametre d'URL ("annual") vers le cycle de l'interface. */
export function fromCycleParam(value: string | null): "monthly" | "yearly" {
  return value === "annual" ? "yearly" : "monthly";
}
