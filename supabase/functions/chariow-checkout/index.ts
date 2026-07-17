/**
 * chariow-checkout — Optimum Immo
 *
 * Crée une session Checkout Chariow pour le forfait choisi (Starter / Standard / Pro,
 * mensuel ou annuel) et renvoie l'URL de paiement.
 *
 * Docs : https://chariow.dev/api-reference/checkout/init-checkout
 */
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";
import { getCorsHeaders } from "../_shared/cors.ts";

type PlanId = "starter" | "standard" | "pro";
type BillingCycle = "monthly" | "yearly";

const BodySchema = z.object({
  plan: z.enum(["starter", "standard", "pro"]),
  billing_cycle: z.enum(["monthly", "yearly"]).default("monthly"),
  success_url: z.string().url().optional(),
  phone: z
    .object({
      number: z.string().min(3),
      country_code: z.string().min(1),
    })
    .optional(),
});

function resolveProductId(plan: PlanId, cycle: BillingCycle): string | null {
  const key = `CHARIOW_PRODUCT_${plan.toUpperCase()}_${cycle.toUpperCase()}`;
  return Deno.env.get(key) ?? null;
}

/** Parse un numéro libre en { country_code, number }. Fallback: GN (+224). */
function parsePhone(raw?: string | null): { country_code: string; number: string } {
  const fallback = { country_code: "224", number: "" };
  if (!raw) return fallback;
  const trimmed = raw.trim();
  // Format international: +XXX YYYYYYY
  const intl = trimmed.match(/^\+(\d{1,4})[\s\-.]*([\d\s\-.]+)$/);
  if (intl) {
    return {
      country_code: intl[1],
      number: intl[2].replace(/\D/g, ""),
    };
  }
  // Sinon on garde uniquement les chiffres et on suppose Guinée
  const digits = trimmed.replace(/\D/g, "");
  if (digits.startsWith("224") && digits.length > 3) {
    return { country_code: "224", number: digits.slice(3) };
  }
  return { country_code: "224", number: digits };
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // 1. Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Session expirée. Veuillez vous reconnecter." }, 401, corsHeaders);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      console.error("[chariow-checkout] JWT invalid", claimsError);
      return json({ error: "Session expirée. Veuillez vous reconnecter." }, 401, corsHeaders);
    }
    const userId = claimsData.claims.sub as string;

    // 2. Body
    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return json(
        { error: "Requête invalide.", details: parsed.error.flatten() },
        400,
        corsHeaders
      );
    }
    const { plan, billing_cycle, success_url, phone: phoneFromBody } = parsed.data;

    // 3. Env check — explicite
    const apiKey = Deno.env.get("CHARIOW_API_KEY");
    if (!apiKey) {
      console.error("[chariow-checkout] CHARIOW_API_KEY missing");
      return json({ error: "Configuration Chariow incomplète (clé API manquante)." }, 500, corsHeaders);
    }
    const productId = resolveProductId(plan, billing_cycle);
    if (!productId) {
      console.error(`[chariow-checkout] Missing CHARIOW_PRODUCT_${plan.toUpperCase()}_${billing_cycle.toUpperCase()}`);
      return json(
        { error: `Produit Chariow non configuré pour ${plan} (${billing_cycle}).` },
        500,
        corsHeaders
      );
    }

    // 4. Profil + entreprise (avec téléphone)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, nom, email, entreprise_id, entreprises:entreprise_id(id, nom, telephone, email)")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      console.error("[chariow-checkout] Profile fetch error", profileError);
      return json({ error: "Impossible de récupérer votre profil." }, 500, corsHeaders);
    }
    if (!profile?.entreprise_id) {
      return json({ error: "Aucune entreprise associée à ce compte." }, 400, corsHeaders);
    }

    const entreprise = (profile as { entreprises?: { id: string; nom: string; telephone: string | null; email: string | null } | null }).entreprises ?? null;

    // 5. Phone: body override, sinon parse entreprise.telephone
    const phone = phoneFromBody ?? parsePhone(entreprise?.telephone ?? null);
    if (!phone.number || phone.number.length < 6) {
      return json(
        {
          error:
            "Numéro de téléphone manquant. Veuillez renseigner le téléphone de votre entreprise dans Paramètres avant de payer.",
        },
        400,
        corsHeaders
      );
    }

    // 6. Nom
    const fullName = (profile.nom ?? "").trim();
    const [firstName, ...rest] = fullName ? fullName.split(/\s+/) : [""];
    const lastName = rest.join(" ") || firstName || "Client";

    // 7. Redirect
    const origin = req.headers.get("origin") ?? "";
    const redirectUrl =
      success_url || (origin ? `${origin}/abonnement?checkout=success` : undefined);

    const chariowPayload = {
      product_id: productId,
      email: profile.email ?? entreprise?.email ?? "",
      first_name: (firstName || "Client").slice(0, 50),
      last_name: lastName.slice(0, 50),
      phone: {
        country_code: phone.country_code,
        number: phone.number,
      },
      redirect_url: redirectUrl,
      custom_metadata: {
        entreprise_id: profile.entreprise_id,
        user_id: userId,
        plan,
        billing_cycle,
        entreprise_nom: entreprise?.nom ?? "",
      },
    };

    console.log("[chariow-checkout] Sending to Chariow", {
      product_id: productId,
      plan,
      billing_cycle,
      email: chariowPayload.email,
      phone_cc: phone.country_code,
    });

    // 8. Appel Chariow
    const chariowResp = await fetch("https://api.chariow.com/v1/checkout", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(chariowPayload),
    });

    const chariowJson = await chariowResp.json().catch(() => ({}));
    if (!chariowResp.ok) {
      console.error("[chariow-checkout] Chariow error", chariowResp.status, chariowJson);
      const msg =
        (chariowJson as { message?: string })?.message ||
        `Erreur Chariow (${chariowResp.status}).`;
      return json(
        { error: `Chariow a refusé la requête : ${msg}`, details: chariowJson },
        502,
        corsHeaders
      );
    }

    const step = (chariowJson as { data?: { step?: string } })?.data?.step;
    const checkoutUrl = (chariowJson as { data?: { payment?: { checkout_url?: string } } })?.data
      ?.payment?.checkout_url;

    if (step !== "payment" || !checkoutUrl) {
      console.error("[chariow-checkout] Unexpected response", chariowJson);
      return json(
        { error: "Réponse Chariow inattendue.", details: chariowJson },
        502,
        corsHeaders
      );
    }

    // 9. subscriptions → pending_payment (service role, bypass RLS)
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error: updateError } = await admin
      .from("subscriptions")
      .update({
        status: "pending_payment",
        plan,
        billing_cycle,
        payment_provider: "chariow",
        metadata: {
          last_checkout_at: new Date().toISOString(),
          chariow_sale_id:
            (chariowJson as { data?: { purchase?: { id?: string } } })?.data?.purchase?.id ??
            null,
          chariow_product_id: productId,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("entreprise_id", profile.entreprise_id);

    if (updateError) {
      console.error("[chariow-checkout] subscriptions update error", updateError);
      // On ne bloque pas le checkout — l'URL est valide.
    }

    return json({ checkout_url: checkoutUrl }, 200, corsHeaders);
  } catch (err) {
    console.error("[chariow-checkout] Fatal", err);
    const message = err instanceof Error ? err.message : "Erreur interne";
    return json({ error: `Paiement temporairement indisponible : ${message}` }, 500, corsHeaders);
  }
});

function json(payload: unknown, status: number, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
