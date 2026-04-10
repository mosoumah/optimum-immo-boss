/**
 * Shared CORS helper — Optimum Immo
 * Autorise uniquement les origines connues (production + previews Lovable)
 */

const ALLOWED_ORIGINS = [
  // Production & previews Lovable
  /^https:\/\/.*\.lovable\.app$/,
  // Développement local
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
];

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
