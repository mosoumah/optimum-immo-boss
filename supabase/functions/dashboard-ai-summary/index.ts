import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// In-memory rate limit cache
const rateLimitCache = new Map<string, number>();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. JWT verification
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Token invalide" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;

    // 2. Get entreprise_id from profile (server-side)
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: profile } = await adminClient
      .from("profiles")
      .select("entreprise_id")
      .eq("id", userId)
      .maybeSingle();

    if (!profile?.entreprise_id) {
      return new Response(JSON.stringify({ error: "Profil introuvable" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const entrepriseId = profile.entreprise_id;

    // 3. Check if user is admin (bypass premium check)
    const { data: userRole } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    const isAdmin = userRole?.role === "admin";

    // 4. Verify Premium subscription (skip for admin)
    if (!isAdmin) {
      const { data: subscription } = await adminClient
        .from("subscriptions")
        .select("plan, status, end_date")
        .eq("entreprise_id", entrepriseId)
        .maybeSingle();

      const isPremium =
        subscription?.plan === "premium" &&
        subscription?.status === "active" &&
        (!subscription?.end_date || new Date(subscription.end_date) > new Date());

      if (!isPremium) {
        return new Response(
          JSON.stringify({ error: "Plan Premium requis" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // 4. Rate limiting (1 call per hour per entreprise)
    const lastCall = rateLimitCache.get(entrepriseId);
    const now = Date.now();
    if (lastCall && now - lastCall < 3600000) {
      return new Response(
        JSON.stringify({ error: "Rate limit: 1 appel par heure", retry_after: Math.ceil((3600000 - (now - lastCall)) / 1000) }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Fetch dashboard stats for AI context
    const { data: simpleStats } = await adminClient
      .from("v_dashboard_simple")
      .select("*")
      .eq("entreprise_id", entrepriseId)
      .maybeSingle();

    const { data: advancedStats } = await adminClient
      .from("v_dashboard_advanced_finance")
      .select("*")
      .eq("entreprise_id", entrepriseId)
      .maybeSingle();

    const { data: propertyStats } = await adminClient
      .from("v_dashboard_advanced_property")
      .select("*")
      .eq("entreprise_id", entrepriseId)
      .maybeSingle();

    // 6. Call AI model
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Configuration IA manquante" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `Tu es un assistant financier pour une agence immobilière en Guinée. Analyse ces données du mois en cours et génère un résumé concis de 2-3 phrases en français, avec les points clés et recommandations.

Données:
- Revenus totaux: ${simpleStats?.revenus_mois || 0} GNF
- Dépenses totales: ${simpleStats?.depenses_mois || 0} GNF
- Bénéfice estimé: ${simpleStats?.benefice_estime || 0} GNF
- Factures impayées: ${simpleStats?.factures_impayees || 0}
- Revenus court séjour: ${advancedStats?.revenus_court_sejour || 0} GNF
- Revenus mensuel: ${advancedStats?.revenus_mensuel || 0} GNF
- Revenus vente: ${advancedStats?.revenus_vente || 0} GNF
- Loyers en retard: ${advancedStats?.loyers_en_retard || 0}
- Taux d'occupation: ${propertyStats?.taux_occupation || 0}%
- Biens actifs: ${propertyStats?.biens_total || 0}
- Biens disponibles: ${propertyStats?.biens_disponibles || 0}
- Arrivées aujourd'hui: ${simpleStats?.arrivees_aujourdhui || 0}
- Départs aujourd'hui: ${simpleStats?.departs_aujourdhui || 0}

Réponds uniquement avec le résumé, sans titre ni préambule.`;

    const aiResponse = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const summary = aiData.choices?.[0]?.message?.content || "Résumé indisponible pour le moment.";

    // Update rate limit cache
    rateLimitCache.set(entrepriseId, now);

    return new Response(
      JSON.stringify({ summary, generated_at: new Date().toISOString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Dashboard AI Summary error:", error);
    return new Response(
      JSON.stringify({ error: "Erreur lors de la génération du résumé" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
