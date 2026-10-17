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
 * - HTTP 403 avec code "plan_feature_ai" pour chat-assistant (seule fonction IA
 *   encore appelée par le frontend).
 *
 * Dans tous les cas on affiche le texte fourni par le serveur (jamais réécrit)
 * et un bouton menant aux formules.
 */

export type PlanLimitKind =
  | "factures"
  | "users"
  | "messaging"
  | "permissions"
  | "ai"
  | "subscription";

const MESSAGE_PREFIXES: Record<"factures" | "messaging" | "permissions", string> = {
  factures: "PLAN_LIMIT_FACTURES",
  messaging: "PLAN_FEATURE_MESSAGING",
  permissions: "PLAN_FEATURE_PERMISSIONS",
};

const USERS_CODE = "plan_limit_users";
const AI_CODE = "plan_feature_ai";
/** Erreur SQL renvoyée par le serveur quand l'abonnement est expiré. */
const SUBSCRIPTION_MESSAGE = "SUBSCRIPTION_EXPIRED";
/** Code renvoyé par les Edge Functions (admin-create-user, generate-facture). */
const SUBSCRIPTION_CODE = "subscription_expired";

const TITLES: Record<PlanLimitKind, string> = {
  factures: "Limite de factures atteinte",
  users: "Limite d'utilisateurs atteinte",
  messaging: "Messagerie non incluse dans votre formule",
  permissions: "Gestion des permissions non incluse",
  ai: "Assistant IA non inclus dans votre formule",
  subscription: "Abonnement expiré",
};

/** Libellé du bouton d'action, par type de refus. */
const ACTION_LABELS: Record<PlanLimitKind, string> = {
  factures: "Voir les formules",
  users: "Voir les formules",
  messaging: "Voir les formules",
  permissions: "Voir les formules",
  ai: "Voir les formules",
  subscription: "Voir les abonnements",
};

/** Messages fixes : le message brut du serveur n'est pas présentable. */
const FIXED_MESSAGES: Partial<Record<PlanLimitKind, string>> = {
  subscription: "Votre abonnement a expiré. Vous êtes en lecture seule.",
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

/** Détecte l'erreur SQL d'abonnement expiré (marqueur présent dans le message). */
export const isSubscriptionExpiredMessage = (message: string | null | undefined): boolean =>
  typeof message === "string" && message.includes(SUBSCRIPTION_MESSAGE);

/** Détecte le code d'abonnement expiré renvoyé par une Edge Function. */
export const isSubscriptionExpiredCode = (code: unknown): boolean => code === SUBSCRIPTION_CODE;

/** Détecte le code depuis un corps de réponse JSON. */
export const isSubscriptionExpiredPayload = (payload: unknown): boolean => {
  if (!payload || typeof payload !== "object") return false;
  return (payload as { code?: unknown }).code === SUBSCRIPTION_CODE;
};

/**
 * Reconnaît n'importe quel marqueur de formule à partir d'un message d'erreur.
 * Renvoie null si le message n'en contient aucun.
 */
export function detectPlanLimitFromMessage(
  message: string | null | undefined,
): PlanLimitKind | null {
  if (typeof message !== "string") return null;
  // Le marqueur d'abonnement peut être noyé dans un message SQL plus long.
  if (message.includes(SUBSCRIPTION_MESSAGE)) return "subscription";
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
  const description = FIXED_MESSAGES[kind] ?? message;
  const actionLabel = ACTION_LABELS[kind];
  const goToPlans = () => ctx.navigate("/abonnement");

  if (ctx.toastSonner) {
    ctx.toastSonner.error(title, {
      description,
      action: { label: actionLabel, onClick: goToPlans },
    });
    return;
  }

  ctx.toast?.({
    title,
    description,
    variant: "destructive",
    action: createElement(
      ToastAction,
      { altText: actionLabel, onClick: goToPlans },
      actionLabel,
    ) as unknown as ToastActionElement,
  });
}

/** Affiche le toast « abonnement expiré, lecture seule ». */
export function showSubscriptionExpired(ctx: PlanLimitContext): void {
  showPlanLimitToast("subscription", "", ctx);
}

/**
 * Affiche le toast si le message est une erreur SQL d'abonnement expiré.
 * Renvoie true si le cas a été traité (l'appelant peut s'arrêter là).
 */
export function handleSubscriptionExpiredMessage(
  message: string | null | undefined,
  ctx: PlanLimitContext,
): boolean {
  if (!isSubscriptionExpiredMessage(message)) return false;
  showSubscriptionExpired(ctx);
  return true;
}

/** Idem, à partir du code renvoyé par une Edge Function. */
export function handleSubscriptionExpiredCode(
  code: unknown,
  ctx: PlanLimitContext,
): boolean {
  if (!isSubscriptionExpiredCode(code)) return false;
  showSubscriptionExpired(ctx);
  return true;
}

/** Lit le corps JSON d'une erreur d'Edge Function (FunctionsHttpError). */
export async function readFunctionErrorBody(
  error: unknown,
): Promise<{ error?: string; code?: string } | null> {
  const ctx = (error as { context?: { json?: () => Promise<unknown> } } | null)?.context;
  if (!ctx || typeof ctx.json !== "function") return null;
  try {
    const body = await ctx.json();
    return body && typeof body === "object"
      ? (body as { error?: string; code?: string })
      : null;
  } catch {
    return null;
  }
}

/**
 * Traite le refus d'abonnement expiré renvoyé par une Edge Function.
 * Renvoie true si le cas a été traité (toast affiché).
 */
export async function handleSubscriptionExpiredFunctionError(
  error: unknown,
  ctx: PlanLimitContext,
): Promise<boolean> {
  const body = await readFunctionErrorBody(error);
  return handleSubscriptionExpiredCode(body?.code, ctx);
}

/** Indices d'un refus de droits sans marqueur explicite (stockage notamment). */
const PERMISSION_DENIED_HINTS = [
  "row-level security",
  "permission denied",
  "not authorized",
  "unauthorized",
  "access denied",
  "403",
];

/** Vrai si le message ressemble à un refus de droits (403 / RLS). */
export const isPermissionDeniedMessage = (message: string | null | undefined): boolean => {
  if (typeof message !== "string") return false;
  const lower = message.toLowerCase();
  return PERMISSION_DENIED_HINTS.some((hint) => lower.includes(hint));
};

/**
 * Traite un échec d'opération de stockage.
 *
 * Le stockage ne renvoie pas toujours le mot SUBSCRIPTION_EXPIRED : on affiche
 * le message d'abonnement expiré seulement si useSubscription indique
 * `is_expired` ET que l'échec ressemble à un refus de droits. Sinon l'appelant
 * conserve son message habituel.
 *
 * Renvoie true si le cas a été traité (toast affiché).
 */
export function handleStorageRefusal(
  message: string | null | undefined,
  isExpired: boolean,
  ctx: PlanLimitContext,
): boolean {
  if (isSubscriptionExpiredMessage(message)) {
    showSubscriptionExpired(ctx);
    return true;
  }
  if (isExpired && isPermissionDeniedMessage(message)) {
    showSubscriptionExpired(ctx);
    return true;
  }
  return false;
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
