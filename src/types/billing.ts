import { supabase } from "@/integrations/supabase/client";

/**
 * Types du domaine facturation.
 *
 * Les tables `plans` et `subscription_payments` existent en production mais ne
 * sont volontairement pas présentes dans `src/integrations/supabase/types.ts`
 * (fichier auto-généré). On isole donc ici les interfaces et les accès typés.
 */

export type PlanCode = "starter" | "standard" | "pro";

/** Cycle de facturation tel qu'attendu par saspay-checkout et les paramètres d'URL. */
export type BillingCycleParam = "monthly" | "annual";

/** Ligne de public.plans */
export interface PlanRow {
  code: string;
  nom: string;
  /** numeric : peut arriver en chaîne selon le driver PostgREST. */
  prix_mensuel_gnf: number | string;
  /** numeric, calculé par la base (mensuel x 10, 2 mois offerts). */
  prix_annuel_gnf: number | string;
  /** NULL = illimité */
  max_utilisateurs: number | null;
  /** NULL = illimité */
  max_factures_par_mois: number | null;
  /** Fonctionnalités incluses (text[]) : ai_assistant, permissions, etc. */
  features: string[] | null;
  actif: boolean;
}

export type PaymentStatus = "pending" | "success" | "failed" | "cancelled";

/** Ligne de public.subscription_payments */
export interface SubscriptionPaymentRow {
  id: string;
  entreprise_id: string;
  plan: string;
  montant: number | string;
  devise: string;
  statut: PaymentStatus;
  billing_cycle: BillingCycleParam | null;
  saspay_session_id: string | null;
  saspay_payment_id: string | null;
  saspay_reference: string | null;
  created_by: string | null;
  created_at: string;
  paid_at: string | null;
  period_start: string | null;
  period_end: string | null;
}

/** Réponse de l'Edge Function saspay-checkout, action "create". */
export interface CheckoutCreateResponse {
  checkout_url: string;
  payment_id: string;
}

export type SyncStatus = "success" | "pending" | "failed" | "cancelled" | "none";

/** Réponse de l'Edge Function saspay-checkout, action "sync". */
export interface CheckoutSyncResponse {
  status: SyncStatus;
}

// Tables absentes des types générés : cast localisé, aucune modification de types.ts.
type PlanQuery = {
  select: (columns: string) => {
    eq: (column: string, value: unknown) => {
      order: (column: string, options: { ascending: boolean }) => PromiseLike<{
        data: PlanRow[] | null;
        error: { message: string } | null;
      }>;
    };
  };
};

type PaymentQuery = {
  select: (columns: string) => {
    eq: (column: string, value: unknown) => {
      order: (column: string, options: { ascending: boolean }) => {
        limit: (count: number) => PromiseLike<{
          data: SubscriptionPaymentRow[] | null;
          error: { message: string } | null;
        }>;
      };
    };
  };
};

/** public.plans — actifs uniquement, triés par prix croissant. */
export function plansTable() {
  return supabase.from("plans" as never) as unknown as PlanQuery;
}

/** public.subscription_payments — toujours filtrée par agence. */
export function subscriptionPaymentsTable() {
  return supabase.from("subscription_payments" as never) as unknown as PaymentQuery;
}
