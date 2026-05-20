/**
 * Shared CORS helper — Optimum Immo
 * Autorise uniquement les origines connues (production + previews Lovable)
 */

const ALLOWED_ORIGINS: RegExp[] = [
  // Production & previews Lovable
  /^https:\/\/.*\.lovable\.app$/,
  /^https:\/\/.*\.lovableproject\.com$/,
  /^https:\/\/.*\.lovable\.dev$/,
  // Développement local uniquement
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
];

// Domaine de production personnalisé via variable d'environnement
const customDomain = (typeof Deno !== "undefined" ? Deno.env.get("APP_URL") : undefined) ?? "";
if (customDomain) {
  try {
    const parsed = new URL(customDomain);
    // Escape special regex chars and build exact-match pattern
    const escaped = parsed.origin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    ALLOWED_ORIGINS.push(new RegExp(`^${escaped}$`));
  } catch {
    // Invalid APP_URL — ignore
  }
}

export function getAllowedOrigin(req: Request): string {
  const origin = req.headers.get("origin") ?? "";
  const isAllowed = ALLOWED_ORIGINS.some((pattern) => pattern.test(origin));
  return isAllowed ? origin : "null";
}

export function getCorsHeaders(req: Request): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": getAllowedOrigin(req),
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}
