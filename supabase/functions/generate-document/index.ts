import { getCorsHeaders } from '../_shared/cors.ts';
import { createClient } from "npm:@supabase/supabase-js@2";

;

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Token invalide" }), {
        status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const {
      entrepriseNom, typeDocument, documentNumber, creationDate,
      agentName, agencyPhone, agencyEmail,
      clientNom, clientPhone, clientEmail, clientAddress,
      propertyTitle, propertyAddress, propertyType,
      salePrice, rentalDuration, securityDeposit,
      clauses, signatureDate,
    } = body;

    if (!typeDocument || typeof typeDocument !== "string" || !typeDocument.trim()) {
      return new Response(JSON.stringify({ error: "Le type de document est requis" }), {
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Sanitize all text inputs to prevent prompt injection and limit token usage
    const s = (v: unknown, max = 200): string =>
      typeof v === "string" ? v.slice(0, max).trim() : "";

    const safeEntrepriseNom   = s(entrepriseNom, 100);
    const safeTypeDocument    = s(typeDocument, 80);
    const safeDocumentNumber  = s(documentNumber, 50);
    const safeCreationDate    = s(creationDate, 30);
    const safeAgentName       = s(agentName, 100);
    const safeAgencyPhone     = s(agencyPhone, 30);
    const safeAgencyEmail     = s(agencyEmail, 100);
    const safeClientNom       = s(clientNom, 100);
    const safeClientPhone     = s(clientPhone, 30);
    const safeClientEmail     = s(clientEmail, 100);
    const safeClientAddress   = s(clientAddress, 200);
    const safePropertyTitle   = s(propertyTitle, 150);
    const safePropertyAddress = s(propertyAddress, 200);
    const safePropertyType    = s(propertyType, 80);
    const safeSalePrice       = s(salePrice, 50);
    const safeRentalDuration  = s(rentalDuration, 50);
    const safeSecurityDeposit = s(securityDeposit, 50);
    const safeClauses         = s(clauses, 1000);
    const safeSignatureDate   = s(signatureDate, 30);

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

    const userPrompt = `Rédige un document professionnel de type "${safeTypeDocument}" pour une agence immobilière.

INFORMATIONS DU DOCUMENT :
Numéro : ${safeDocumentNumber || "Non spécifié"}
Date de création : ${safeCreationDate || "Non spécifiée"}

INFORMATIONS DE L'AGENCE :
Nom de l'agence : ${safeEntrepriseNom || "Non spécifié"}
Nom de l'agent : ${safeAgentName || "Non spécifié"}
Téléphone : ${safeAgencyPhone || "Non spécifié"}
Email : ${safeAgencyEmail || "Non spécifié"}

INFORMATIONS DU CLIENT :
Nom : ${safeClientNom || "Non spécifié"}
Téléphone : ${safeClientPhone || "Non spécifié"}
Email : ${safeClientEmail || "Non spécifié"}
Adresse : ${safeClientAddress || "Non spécifiée"}

INFORMATIONS DU BIEN :
Titre : ${safePropertyTitle || "Non spécifié"}
Adresse : ${safePropertyAddress || "Non spécifiée"}
Type : ${safePropertyType || "Non spécifié"}

INFORMATIONS DE LA TRANSACTION :
Prix / Loyer : ${safeSalePrice || "Non spécifié"}
Durée de location : ${safeRentalDuration || "Non spécifiée"}
Caution : ${safeSecurityDeposit || "Non spécifiée"}

CLAUSES PERSONNALISÉES :
${safeClauses || "Aucune clause spécifique."}

DATE DE SIGNATURE : ${safeSignatureDate || "Non spécifiée"}

STRUCTURE ATTENDUE (en paragraphes élégants) :

PARAGRAPHE 1 - Introduction formelle :
Présente l'objet du document de manière professionnelle et solennelle. Mentionne le contexte et les parties concernées avec les informations fournies.

PARAGRAPHE 2 - Corps du document :
Développe le contenu principal avec précision et clarté. Inclus les éléments du bien, du client et de la transaction.

PARAGRAPHE 3 - Dispositions ou engagement :
Précise les conditions, engagements ou modalités applicables. Intègre les clauses personnalisées si fournies.

PARAGRAPHE 4 - Conclusion formelle :
Termine par une formule officielle appropriée au type de document, incluant la date et le lieu de signature.

Génère maintenant le document adapté au type "${safeTypeDocument}".`;

    console.log('Generating document:', safeTypeDocument, 'for client:', safeClientNom);

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
          status: 429, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits insuffisants, veuillez recharger votre compte." }), {
          status: 402, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Erreur du service IA" }), {
        status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    let generatedContent = data.choices?.[0]?.message?.content || "";
    generatedContent = nettoyerContenu(generatedContent);

    console.log('Document generated successfully');

    return new Response(JSON.stringify({ content: generatedContent }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-document error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erreur inconnue" }), {
      status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
