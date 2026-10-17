import { createElement } from "react";
import { ToastAction, type ToastActionElement } from "@/components/ui/toast";

/**
 * Gestion des refus liés aux limites et fonctionnalités de formule.
 *
 * Le serveur renvoie des marqueurs dédiés :
 * - "PLAN_LIMIT_FACTURES" en tête du message PostgREST (facture, ou facture
 *   générée depuis une réservation) ;
 * - "PLAN_FEATURE_MESSAGING" pour l'envoi d'un message interne ;
 * - "PLAN_FEATURE_PERMISSIONS" pour la modification de permissions ;
 * - code "plan_limit_users" dans la réponse de admin-create-user ;
 * - HTTP 403 avec code "plan_feature_ai" pour chat-assistant, suggest-tasks et
 *   dashboard-ai-summary.
 *
 * Dans tous les cas on affiche le texte fourni par le serveur (jamais réécrit)
 * et un bouton menant aux formules.
 */

export type PlanLimitKind =
  | "factures"
  | "users"
  | "messaging"
  | "permissions"
  | "ai";

const MESSAGE_PREFIXES: Record<"factures" | "messaging" | "permissions", string> = {
  factures: "PLAN_LIMIT_FACTURES",
  messaging: "PLAN_FEATURE_MESSAGING",
  permissions: "PLAN_FEATURE_PERMISSIONS",
};

const USERS_CODE = "plan_limit_users";
const AI_CODE = "plan_feature_ai";

const TITLES: Record<PlanLimitKind, string> = {
  factures: "Limite de factures atteinte",
  users: "Limite d'utilisateurs atteinte",
  messaging: "Messagerie non incluse dans votre formule",
  permissions: "Gestion des permissions non incluse",
  ai: "Assistant IA non inclus dans votre formule",
};

/** Détecte un refus de quota pour la création de facture. */
export const isFacturePlanLimit = (message: string | null | undefined): boolean =>
  typeof message === "string" && message.startsWith(MESSAGE_PREFIXES.factures);

/** Détecte un refus de quota pour la création d'utilisateur. */
export const isUserPlanLimit = (code: unknown): boolean => code === USERS_CODE;

/** Détecte le refus d'envoi d'un message interne (formule sans messagerie). */
export const isMessagingPlanLimit = (message: string | null | undefined): boolean =>
  typeof message === "string" && message.startsWith(MESSAGE_PREFIXES.messaging);

/** Détecte le refus de modification des permissions. */
export const isPermissionsPlanLimit = (message: string | null | undefined): boolean =>
  typeof message === "string" && message.startsWith(MESSAGE_PREFIXES.permissions);

/** Détecte un refus d'accès aux fonctions IA (403 + code plan_feature_ai). */
export const isAiPlanLimit = (payload: unknown): boolean => {
  if (!payload || typeof payload !== "object") return false;
  const value = (payload as { code?: unknown }).code;
  return value === AI_CODE;
};

/**
 * Reconnaît n'importe quel marqueur de formule à partir d'un message d'erreur.
 * Renvoie null si le message n'en contient aucun.
 */
export function detectPlanLimitFromMessage(
  message: string | null | undefined,
): PlanLimitKind | null {
  if (typeof message !== "string") return null;
  if (message.startsWith(MESSAGE_PREFIXES.factures)) return "factures";
  if (message.startsWith(MESSAGE_PREFIXES.messaging)) return "messaging";
  if (message.startsWith(MESSAGE_PREFIXES.permissions)) return "permissions";
  return null;
}

/**
 * Détecte un refus IA : HTTP 403 dont le corps porte code "plan_feature_ai".
 * supabase-js expose le corps via error.context.json().
 */
export async function detectAiPlanLimit(error: unknown): Promise<boolean> {
  const ctx = (error as { context?: { status?: number; json?: () => Promise<unknown> } } | null)
    ?.context;
  if (!ctx) return false;
  if (typeof ctx.status === "number" && ctx.status !== 403) return false;
  if (typeof ctx.json !== "function") return false;
  try {
    return isAiPlanLimit(await ctx.json());
  } catch {
    return false;
  }
}

type AppToast = (options: {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  action?: ToastActionElement;
}) => void;

type SonnerToast = {
  error: (
    message: string,
    options?: { description?: string; action?: { label: string; onClick: () => void } },
  ) => void;
};

export interface PlanLimitContext {
  navigate: (to: string) => void;
  /** Toast de l'application (hook use-toast) — attend un élément ToastAction. */
  toast?: AppToast;
  /** Toast de sonner — utilisé par les dialogues. */
  toastSonner?: SonnerToast;
}

/** Affiche le refus avec le bouton "Voir les formules". */
export function showPlanLimitToast(
  kind: PlanLimitKind,
  message: string,
  ctx: PlanLimitContext,
): void {
  const title = TITLES[kind];
  const goToPlans = () => ctx.navigate("/abonnement");

  if (ctx.toastSonner) {
    ctx.toastSonner.error(title, {
      description: message,
      action: { label: "Voir les formules", onClick: goToPlans },
    });
    return;
  }

  ctx.toast?.({
    title,
    description: message,
    variant: "destructive",
    action: createElement(
      ToastAction,
      { altText: "Voir les formules", onClick: goToPlans },
      "Voir les formules",
    ) as unknown as ToastActionElement,
  });
}

/**
 * Lit le message d'erreur et affiche le toast adéquat.
 * Renvoie true si un marqueur de formule a été reconnu (l'appelant peut alors
 * arrêter son traitement et ne pas afficher son message générique).
 */
export function handlePlanLimitError(
  message: string | null | undefined,
  ctx: PlanLimitContext,
): boolean {
  const kind = detectPlanLimitFromMessage(message);
  if (!kind || typeof message !== "string") return false;
  showPlanLimitToast(kind, message, ctx);
  return true;
}
