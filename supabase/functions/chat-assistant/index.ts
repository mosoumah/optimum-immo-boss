import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const tools = [
  {
    type: "function",
    function: {
      name: "analyze_finances",
      description: "Analyser les données financières: revenus, dépenses, bénéfice, factures impayées",
      parameters: {
        type: "object",
        properties: {
          metric: {
            type: "string",
            enum: ["revenus", "depenses", "benefice", "factures_impayees", "resume_complet"],
            description: "Métrique à analyser",
          },
        },
        required: ["metric"],
      },
    },
  },
];

async function executeTool(
  toolName: string,
  args: Record<string, unknown>,
  supabase: ReturnType<typeof createClient>,
  entrepriseId: string
): Promise<string> {
  try {
    switch (toolName) {
      case "analyze_finances": {
        const { data: simple } = await supabase
          .from("v_dashboard_simple")
          .select("*")
          .eq("entreprise_id", entrepriseId)
          .maybeSingle();

        const { data: advanced } = await supabase
          .from("v_dashboard_advanced_finance")
          .select("*")
          .eq("entreprise_id", entrepriseId)
          .maybeSingle();

        const result: Record<string, unknown> = {};
        const metric = args.metric as string;

        if (metric === "revenus" || metric === "resume_complet") {
          result.revenus_mois = simple?.revenus_mois || 0;
          result.revenus_court_sejour = advanced?.revenus_court_sejour || 0;
          result.revenus_mensuel = advanced?.revenus_mensuel || 0;
        }
        if (metric === "depenses" || metric === "resume_complet") {
          result.depenses_mois = simple?.depenses_mois || 0;
          result.depenses_totales = advanced?.depenses_totales || 0;
        }
        if (metric === "benefice" || metric === "resume_complet") {
          result.benefice_estime = simple?.benefice_estime || 0;
          result.benefice_net = advanced?.benefice_net || 0;
        }
        if (metric === "factures_impayees" || metric === "resume_complet") {
          result.factures_impayees = simple?.factures_impayees || 0;
          result.paiements_attendus = simple?.paiements_attendus || 0;
        }
        if (metric === "resume_complet") {
          result.taches_urgentes = simple?.taches_urgentes || 0;
          result.sejours_en_cours = simple?.sejours_en_cours || 0;
          result.arrivees_aujourdhui = simple?.arrivees_aujourdhui || 0;
          result.departs_aujourdhui = simple?.departs_aujourdhui || 0;
        }
        return JSON.stringify(result);
      }

      default:
        return JSON.stringify({ error: `Outil inconnu: ${toolName}` });
    }
  } catch (e) {
    return JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" });
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    // Get entreprise_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("entreprise_id, nom")
      .eq("id", userId)
      .single();

    if (!profile?.entreprise_id) {
      return new Response(JSON.stringify({ error: "Profil non trouvé" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are ImmoPilot, an AI assistant integrated inside a real estate SaaS platform called "Optimum Immo".
The current user is: ${profile.nom}.

CORE BEHAVIOR:
- You are a professional real estate assistant. Be concise, clear, and action-oriented.
- Do NOT behave like a general chatbot. Do NOT give long explanations unless necessary.

 SCOPE LIMITATION:
- You ONLY respond to financial analysis from platform dashboard views.
- You MUST NOT access or suggest actions on clients, properties, reservations, invoices, quotes, tasks, or document creation.
- If user asks outside financial analysis, respond: "Je peux uniquement aider avec l'analyse financière du tableau de bord."

DATA SECURITY:
- You MUST NEVER access or expose data from other companies. All queries are already filtered by entreprise_id.

 ACTION RULES:
- You can only call analyze_finances.
- Never imply data creation or updates.

SEARCH & ANALYSIS:
- Use real data from tools. Be precise. Keep answers short.
- Format amounts as: X GNF (franc guinéen).

LANGUAGE:
- Respond in the same language as the user (French or English).

FAILSAFE:
- If unsure, ask a clarification question. Do NOT invent data. Do NOT guess.

PERSONALITY:
- Professional, efficient, calm, helpful. NOT funny, casual, or emotional.`;

    // First AI call with tools
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        tools,
        stream: false,
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes, réessayez dans quelques instants." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA insuffisants." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiResponse.text();
      console.error("AI error:", status, t);
      return new Response(JSON.stringify({ error: "Erreur IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await aiResponse.json();
    const choice = aiResult.choices?.[0];

    // If no tool calls, return the text response directly
    if (!choice?.message?.tool_calls || choice.message.tool_calls.length === 0) {
      return new Response(
        JSON.stringify({ response: choice?.message?.content || "Je n'ai pas compris votre demande." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Execute tool calls
    const toolResults = [];
    for (const toolCall of choice.message.tool_calls) {
      const fnName = toolCall.function.name;
      let fnArgs: Record<string, unknown> = {};
      try {
        fnArgs = JSON.parse(toolCall.function.arguments || "{}");
      } catch {
        fnArgs = {};
      }
      const result = await executeTool(fnName, fnArgs, supabase, profile.entreprise_id);
      toolResults.push({
        role: "tool" as const,
        tool_call_id: toolCall.id,
        content: result,
      });
    }

    // Second AI call with tool results to generate final response
    const finalResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
          choice.message,
          ...toolResults,
        ],
        stream: false,
      }),
    });

    if (!finalResponse.ok) {
      console.error("Final AI error:", finalResponse.status);
      return new Response(JSON.stringify({ error: "Erreur lors de la génération de la réponse" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const finalResult = await finalResponse.json();
    const finalContent = finalResult.choices?.[0]?.message?.content || "Opération effectuée.";

    return new Response(JSON.stringify({ response: finalContent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("chat-assistant error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
