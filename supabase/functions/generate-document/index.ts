import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function nettoyerContenu(texte: string): string {
  return texte
    .replace(/^[\s]*[-•*]\s*/gm, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/#{1,6}\s*/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+|\s+$/g, '')
    .trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Token invalide" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      entrepriseNom, typeDocument, documentNumber, creationDate,
      agentName, agencyPhone, agencyEmail,
      clientNom, clientPhone, clientEmail, clientAddress,
      propertyTitle, propertyAddress, propertyType,
      salePrice, rentalDuration, securityDeposit,
      clauses, signatureDate,
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Tu es un expert en rédaction de documents professionnels haut de gamme pour les agences immobilières en Guinée.

STYLE D'ÉCRITURE :
- Langage professionnel, formel et élégant
- Phrases claires, fluides et structurées
- Vocabulaire juridique et commercial approprié
- Ton respectueux, courtois et officiel

FORMAT OBLIGATOIRE :
- Génère UNIQUEMENT le contenu du document (pas d'en-tête, pas d'informations entreprise)
- Structure en paragraphes fluides et élégants
- SANS puces, tirets, astérisques ou markdown
- Espacement logique entre les sections

INTERDICTIONS STRICTES :
- Pas de points de liste (•, -, *, →)
- Pas de markdown (**, ##, etc.)
- Pas de formules génériques ("Cher client", "Cordialement")
- Pas d'en-tête de document (le design s'en charge)`;

    const userPrompt = `Rédige un document professionnel de type "${typeDocument}" pour une agence immobilière.

INFORMATIONS DU DOCUMENT :
Numéro : ${documentNumber || "Non spécifié"}
Date de création : ${creationDate || "Non spécifiée"}

INFORMATIONS DE L'AGENCE :
Nom de l'agence : ${entrepriseNom || "Non spécifié"}
Nom de l'agent : ${agentName || "Non spécifié"}
Téléphone : ${agencyPhone || "Non spécifié"}
Email : ${agencyEmail || "Non spécifié"}

INFORMATIONS DU CLIENT :
Nom : ${clientNom || "Non spécifié"}
Téléphone : ${clientPhone || "Non spécifié"}
Email : ${clientEmail || "Non spécifié"}
Adresse : ${clientAddress || "Non spécifiée"}

INFORMATIONS DU BIEN :
Titre : ${propertyTitle || "Non spécifié"}
Adresse : ${propertyAddress || "Non spécifiée"}
Type : ${propertyType || "Non spécifié"}

INFORMATIONS DE LA TRANSACTION :
Prix / Loyer : ${salePrice || "Non spécifié"}
Durée de location : ${rentalDuration || "Non spécifiée"}
Caution : ${securityDeposit || "Non spécifiée"}

CLAUSES PERSONNALISÉES :
${clauses || "Aucune clause spécifique."}

DATE DE SIGNATURE : ${signatureDate || "Non spécifiée"}

STRUCTURE ATTENDUE (en paragraphes élégants) :

PARAGRAPHE 1 - Introduction formelle :
Présente l'objet du document de manière professionnelle et solennelle. Mentionne le contexte et les parties concernées avec les informations fournies.

PARAGRAPHE 2 - Corps du document :
Développe le contenu principal avec précision et clarté. Inclus les éléments du bien, du client et de la transaction.

PARAGRAPHE 3 - Dispositions ou engagement :
Précise les conditions, engagements ou modalités applicables. Intègre les clauses personnalisées si fournies.

PARAGRAPHE 4 - Conclusion formelle :
Termine par une formule officielle appropriée au type de document, incluant la date et le lieu de signature.

Génère maintenant le document adapté au type "${typeDocument}".`;

    console.log('Generating document:', typeDocument, 'for client:', clientNom);

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
          { role: "user", content: userPrompt },
        ],
        temperature: 0.5,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requêtes atteinte, veuillez réessayer plus tard." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits insuffisants, veuillez recharger votre compte." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Erreur du service IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    let generatedContent = data.choices?.[0]?.message?.content || "";
    generatedContent = nettoyerContenu(generatedContent);

    console.log('Document generated successfully');

    return new Response(JSON.stringify({ content: generatedContent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-document error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erreur inconnue" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
