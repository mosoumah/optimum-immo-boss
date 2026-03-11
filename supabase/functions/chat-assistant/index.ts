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
      name: "create_client",
      description: "Créer un nouveau client dans la base de données",
      parameters: {
        type: "object",
        properties: {
          nom: { type: "string", description: "Nom du client" },
          email: { type: "string", description: "Email du client" },
          telephone: { type: "string", description: "Téléphone du client" },
        },
        required: ["nom"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_tache",
      description: "Créer une nouvelle tâche",
      parameters: {
        type: "object",
        properties: {
          titre: { type: "string", description: "Titre de la tâche" },
          description: { type: "string", description: "Description de la tâche" },
        },
        required: ["titre"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_facture",
      description: "Créer une nouvelle facture. Nécessite un client_id valide.",
      parameters: {
        type: "object",
        properties: {
          client_id: { type: "string", description: "UUID du client" },
          montant: { type: "number", description: "Montant de la facture" },
          description: { type: "string", description: "Description de la facture" },
        },
        required: ["client_id", "montant"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_devis",
      description: "Créer un nouveau devis. Nécessite un client_id valide.",
      parameters: {
        type: "object",
        properties: {
          client_id: { type: "string", description: "UUID du client" },
          montant: { type: "number", description: "Montant du devis" },
          description: { type: "string", description: "Description du devis" },
        },
        required: ["client_id", "montant"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_clients",
      description: "Rechercher des clients par nom ou lister les clients récents",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Terme de recherche (nom ou email)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_factures",
      description: "Rechercher des factures, optionnellement filtrer par statut (paye ou non_paye)",
      parameters: {
        type: "object",
        properties: {
          statut: { type: "string", enum: ["paye", "non_paye"], description: "Filtrer par statut" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_reservations",
      description: "Rechercher des réservations. Peut filtrer par période (semaine, mois) ou statut.",
      parameters: {
        type: "object",
        properties: {
          period: { type: "string", enum: ["semaine", "mois", "aujourdhui"], description: "Période" },
          statut: { type: "string", description: "Statut de réservation" },
        },
      },
    },
  },
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
  {
    type: "function",
    function: {
      name: "search_properties",
      description: "Rechercher des biens immobiliers, optionnellement filtrer par statut",
      parameters: {
        type: "object",
        properties: {
          statut: { type: "string", description: "Statut du bien (disponible, reserve, etc.)" },
        },
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
      case "create_client": {
        const { data, error } = await supabase
          .from("clients")
          .insert({
            entreprise_id: entrepriseId,
            nom: args.nom as string,
            email: (args.email as string) || null,
            telephone: (args.telephone as string) || null,
          })
          .select("id, nom")
          .single();
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, client: data });
      }

      case "create_tache": {
        const { data, error } = await supabase
          .from("taches")
          .insert({
            entreprise_id: entrepriseId,
            titre: args.titre as string,
            description: (args.description as string) || null,
          })
          .select("id, titre")
          .single();
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, tache: data });
      }

      case "create_facture": {
        const { data, error } = await supabase
          .from("factures")
          .insert({
            entreprise_id: entrepriseId,
            client_id: args.client_id as string,
            montant: args.montant as number,
            description: (args.description as string) || null,
          })
          .select("id, montant")
          .single();
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, facture: data });
      }

      case "create_devis": {
        const { data, error } = await supabase
          .from("devis")
          .insert({
            entreprise_id: entrepriseId,
            client_id: args.client_id as string,
            montant: args.montant as number,
            description: (args.description as string) || null,
          })
          .select("id, montant, numero_devis")
          .single();
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, devis: data });
      }

      case "search_clients": {
        let query = supabase
          .from("clients")
          .select("id, nom, email, telephone")
          .eq("entreprise_id", entrepriseId)
          .order("created_at", { ascending: false })
          .limit(10);
        if (args.query) {
          query = query.or(`nom.ilike.%${args.query}%,email.ilike.%${args.query}%`);
        }
        const { data, error } = await query;
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ clients: data || [] });
      }

      case "search_factures": {
        let query = supabase
          .from("factures")
          .select("id, montant, statut, date, description, clients(nom)")
          .eq("entreprise_id", entrepriseId)
          .order("created_at", { ascending: false })
          .limit(15);
        if (args.statut) {
          query = query.eq("statut", args.statut);
        }
        const { data, error } = await query;
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ factures: data || [] });
      }

      case "search_reservations": {
        let query = supabase
          .from("reservations")
          .select("id, property_name, date_arrivee, date_depart, montant_total, statut, clients(nom)")
          .eq("entreprise_id", entrepriseId)
          .order("date_arrivee", { ascending: false })
          .limit(15);

        const now = new Date();
        if (args.period === "aujourdhui") {
          const today = now.toISOString().split("T")[0];
          query = query.or(`date_arrivee.eq.${today},date_depart.eq.${today}`);
        } else if (args.period === "semaine") {
          const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString().split("T")[0];
          const weekAhead = new Date(now.getTime() + 7 * 86400000).toISOString().split("T")[0];
          query = query.gte("date_arrivee", weekAgo).lte("date_arrivee", weekAhead);
        } else if (args.period === "mois") {
          const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
          query = query.gte("date_arrivee", monthStart);
        }
        if (args.statut) {
          query = query.eq("statut", args.statut);
        }
        const { data, error } = await query;
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ reservations: data || [] });
      }

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

      case "search_properties": {
        let query = supabase
          .from("properties")
          .select("id, nom, type_bien, statut, prix, adresse, surface")
          .eq("entreprise_id", entrepriseId)
          .order("created_at", { ascending: false })
          .limit(10);
        if (args.statut) {
          query = query.eq("statut", args.statut);
        }
        const { data, error } = await query;
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ properties: data || [] });
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

    const systemPrompt = `Tu es un assistant IA pour une application de gestion immobilière. L'utilisateur s'appelle ${profile.nom}.
Tu peux:
- Créer des clients, tâches, factures, devis
- Rechercher des clients, factures, réservations, biens
- Analyser les finances (revenus, dépenses, bénéfice, factures impayées)

Réponds toujours en français. Sois concis et utile.
Quand tu crées quelque chose, confirme avec les détails.
Quand tu analyses des données, présente-les de façon claire avec des chiffres formatés.
Pour les montants, utilise le format: X DH (dirham).
Si l'utilisateur demande de créer une facture ou un devis sans préciser le client, demande-lui quel client.
Utilise les outils disponibles pour répondre aux questions. Ne devine pas les données.`;

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
