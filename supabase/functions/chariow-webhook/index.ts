/**
 * chariow-webhook — Optimum Immo
 *
 * Reçoit les événements Chariow (paiement réussi, échec, annulation, renouvellement)
 * et met à jour la table `subscriptions` en conséquence.
 *
 * URL à configurer côté Chariow :
 *   https://<project-ref>.supabase.co/functions/v1/chariow-webhook
 *
 * Cette fonction est publique (pas de JWT). Elle valide le secret partagé
 * (`CHARIOW_WEBHOOK_SECRET`) via l'en-tête `x-chariow-signature` ou le paramètre
 * `?secret=` si Chariow n'envoie pas d'en-tête.
 */
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-chariow-signature",
};

type PlanId = "starter" | "standard" | "pro";
type BillingCycle = "monthly" | "yearly";

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // 1. Validation optionnelle du secret
    const expectedSecret = Deno.env.get("CHARIOW_WEBHOOK_SECRET");
    if (expectedSecret) {
      const url = new URL(req.url);
      const provided =
        req.headers.get("x-chariow-signature") ||
        req.headers.get("x-webhook-secret") ||
        url.searchParams.get("secret");
      if (provided !== expectedSecret) {
        console.warn("[chariow-webhook] Invalid signature");
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // 2. Parse body
    const payload = await req.json().catch(() => null);
    if (!payload) {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[chariow-webhook] Received", JSON.stringify(payload).slice(0, 1000));

    // 3. Extraire les infos utiles — Chariow envoie généralement { event, data: { purchase, ... } }
    const event: string =
      payload.event ?? payload.type ?? payload.name ?? "unknown";
    const data = payload.data ?? payload;
    const purchase = data.purchase ?? data;
    const status: string = purchase.status ?? data.status ?? "";
    const purchaseId: string | null =
      purchase.id ?? data.id ?? data.sale_id ?? null;
    const paymentRef: string | null =
      purchase.payment?.id ??
      purchase.payment_reference ??
      data.payment_reference ??
      purchaseId;

    // metadata a été envoyée au checkout : { entreprise_id, user_id, plan, billing_cycle }
    const metadata =
      purchase.custom_metadata ??
      purchase.metadata ??
      data.custom_metadata ??
      data.metadata ??
      {};
    const entrepriseId: string | null = metadata.entreprise_id ?? null;
    const plan: PlanId | null = (metadata.plan as PlanId) ?? null;
    const billingCycle: BillingCycle =
      (metadata.billing_cycle as BillingCycle) ?? "monthly";

    if (!entrepriseId) {
      console.warn("[chariow-webhook] Missing entreprise_id in metadata", metadata);
      return new Response(JSON.stringify({ received: true, ignored: "no_entreprise_id" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 4. Décider de l'action selon l'événement / statut
    const isSuccess =
      /completed|succeeded|paid|success/i.test(event) ||
      /completed|succeeded|paid|success/i.test(status);
    const isFailed =
      /failed|error|declined/i.test(event) ||
      /failed|error|declined/i.test(status);
    const isCancelled =
      /cancel/i.test(event) || /cancel/i.test(status);
    const isRefunded = /refund/i.test(event) || /refund/i.test(status);

    if (isSuccess && plan) {
      const startDate = new Date();
      const endDate =
        billingCycle === "yearly" ? addMonths(startDate, 12) : addMonths(startDate, 1);

      const { error } = await admin
        .from("subscriptions")
        .update({
          plan,
          status: "active",
          billing_cycle: billingCycle,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          trial_ends_at: null,
          payment_provider: "chariow",
          payment_reference: paymentRef,
          metadata: {
            ...metadata,
            chariow_sale_id: purchaseId,
            last_event: event,
            last_event_at: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        })
        .eq("entreprise_id", entrepriseId);

      if (error) {
        console.error("[chariow-webhook] update active error", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.log("[chariow-webhook] Activated", entrepriseId, plan, billingCycle);
    } else if (isFailed) {
      await admin
        .from("subscriptions")
        .update({
          status: "payment_failed",
          metadata: { ...metadata, last_event: event, last_event_at: new Date().toISOString() },
          updated_at: new Date().toISOString(),
        })
        .eq("entreprise_id", entrepriseId);
      console.log("[chariow-webhook] Payment failed", entrepriseId);
    } else if (isCancelled) {
      await admin
        .from("subscriptions")
        .update({
          status: "cancelled",
          metadata: { ...metadata, last_event: event, last_event_at: new Date().toISOString() },
          updated_at: new Date().toISOString(),
        })
        .eq("entreprise_id", entrepriseId);
      console.log("[chariow-webhook] Cancelled", entrepriseId);
    } else if (isRefunded) {
      await admin
        .from("subscriptions")
        .update({
          status: "refunded",
          metadata: { ...metadata, last_event: event, last_event_at: new Date().toISOString() },
          updated_at: new Date().toISOString(),
        })
        .eq("entreprise_id", entrepriseId);
    } else {
      console.log("[chariow-webhook] Event ignored", event, status);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[chariow-webhook] Fatal", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
