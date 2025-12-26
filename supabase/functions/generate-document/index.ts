import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { entrepriseNom, typeDocument, description, clientNom, localisation, details } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Tu es un assistant professionnel spécialisé dans l'immobilier en Guinée.

Ta mission est de générer des documents professionnels, clairs, structurés et juridiquement neutres pour des agences immobilières.

Informations disponibles :
- Nom de l'entreprise : ${entrepriseNom || "Non spécifié"}
- Type de document demandé : ${typeDocument}
- Description du besoin : ${description || "Non spécifiée"}
- Client (si fourni) : ${clientNom || "Non spécifié"}
- Localisation (si fournie) : ${localisation || "Non spécifiée"}
- Montant / durée / conditions (si fournis) : ${details || "Non spécifiés"}

Règles obligatoires :
1. Le document doit être professionnel, formel et clair
2. Utiliser un français simple adapté au contexte guinéen
3. Structurer le document avec :
   - Un titre clair
   - Une introduction
   - Des sections logiques
   - Une conclusion ou engagement
4. Ne jamais inventer de lois précises
5. Adapter le contenu au type de document demandé, même s'il est nouveau ou non standard
6. Le document doit être prêt à être imprimé ou envoyé à un client

Génère maintenant le document complet.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Génère un document de type "${typeDocument}" avec la description suivante : ${description || "Document standard"}` }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requêtes atteinte, veuillez réessayer plus tard." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits insuffisants, veuillez recharger votre compte." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Erreur du service IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const generatedContent = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ content: generatedContent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-document error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erreur inconnue" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
