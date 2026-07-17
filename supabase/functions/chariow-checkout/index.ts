/**
 * chariow-checkout — Optimum Immo
 *
 * Crée une session Checkout Chariow pour le forfait choisi (Starter / Standard / Pro,
 * mensuel ou annuel) et renvoie l'URL de paiement.
 *
 * Aucune clé API n'est exposée au frontend : toute la logique passe ici.
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
});

/** Résolution product_id Chariow depuis les env vars. */
function resolveProductId(plan: PlanId, cycle: BillingCycle): string | null {
  const key = `CHARIOW_PRODUCT_${plan.toUpperCase()}_${cycle.toUpperCase()}`;
  return Deno.env.get(key) ?? null;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // 1. Auth : on exige un utilisateur connecté
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401, corsHeaders);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return json({ error: "Unauthorized" }, 401, corsHeaders);
    }
    const userId = claimsData.claims.sub as string;

    // 2. Validation du body
    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return json({ error: "Invalid request", details: parsed.error.flatten() }, 400, corsHeaders);
    }
    const { plan, billing_cycle, success_url } = parsed.data;

    // 3. Récupérer le profil + entreprise
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, nom, email, entreprise_id, entreprises:entreprise_id(id, nom)")
      .eq("id", userId)
      .maybeSingle();

    if (profileError || !profile?.entreprise_id) {
      return json({ error: "Profil ou entreprise introuvable" }, 400, corsHeaders);
    }

    const entreprise = (profile as { entreprises?: { id: string; nom: string } | null }).entreprises ?? null;

    // 4. Résoudre le product_id Chariow
    const productId = resolveProductId(plan, billing_cycle);
    if (!productId) {
      console.error(`[chariow-checkout] Missing product id for ${plan}/${billing_cycle}`);
      return json(
        { error: `Aucun produit Chariow configuré pour ${plan} (${billing_cycle}).` },
        500,
        corsHeaders
      );
    }

    const apiKey = Deno.env.get("CHARIOW_API_KEY");
    if (!apiKey) {
      console.error("[chariow-checkout] CHARIOW_API_KEY missing");
      return json({ error: "Chariow n'est pas encore configuré." }, 500, corsHeaders);
    }

    // 5. Split nom en first/last (best effort)
    const fullName = (profile.nom ?? "").trim();
    const [firstName, ...rest] = fullName ? fullName.split(/\s+/) : [""];
    const lastName = rest.join(" ") || firstName || "Client";

    // 6. Redirect URL après paiement
    const origin = req.headers.get("origin") ?? "";
    const redirectUrl =
      success_url ||
      (origin ? `${origin}/abonnement?checkout=success` : undefined);

    // 7. Appel Chariow — Initiate Checkout
    const chariowResp = await fetch("https://api.chariow.com/v1/checkout", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        product_id: productId,
        email: profile.email,
        first_name: firstName.slice(0, 50) || "Client",
        last_name: lastName.slice(0, 50),
        redirect_url: redirectUrl,
        custom_metadata: {
          entreprise_id: profile.entreprise_id,
          user_id: userId,
          plan,
          billing_cycle,
          entreprise_nom: entreprise?.nom ?? "",
        },
      }),
    });

    const chariowJson = await chariowResp.json().catch(() => ({}));
    if (!chariowResp.ok) {
      console.error("[chariow-checkout] Chariow error", chariowResp.status, chariowJson);
      return json(
        { error: "Impossible de créer la session de paiement.", details: chariowJson },
        502,
        corsHeaders
      );
    }

    const step = chariowJson?.data?.step;
    const checkoutUrl = chariowJson?.data?.payment?.checkout_url as string | undefined;

    if (step !== "payment" || !checkoutUrl) {
      console.error("[chariow-checkout] Unexpected response", chariowJson);
      return json(
        { error: "Réponse Chariow inattendue.", details: chariowJson },
        502,
        corsHeaders
      );
    }

    // 8. Marquer l'abonnement en pending_payment (service role — bypass RLS proprement)
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    await admin
      .from("subscriptions")
      .update({
        status: "pending_payment",
        plan,
        billing_cycle,
        payment_provider: "chariow",
        metadata: {
          last_checkout_at: new Date().toISOString(),
          chariow_sale_id: chariowJson?.data?.purchase?.id ?? null,
          chariow_product_id: productId,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("entreprise_id", profile.entreprise_id);

    return json({ checkout_url: checkoutUrl }, 200, corsHeaders);
  } catch (err) {
    console.error("[chariow-checkout] Fatal", err);
    return json({ error: "Erreur interne" }, 500, corsHeaders);
  }
});

function json(payload: unknown, status: number, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
