import { getCorsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

;

function nombreEnLettres(n: number): string {
  const unites = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const dizaines = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];
  
  if (n === 0) return 'zéro';
  if (n < 0) return 'moins ' + nombreEnLettres(-n);
  
  const convertirMoinsDeMillle = (num: number): string => {
    if (num === 0) return '';
    if (num < 20) return unites[num];
    if (num < 100) {
      const d = Math.floor(num / 10);
      const u = num % 10;
      if (d === 7 || d === 9) {
        return dizaines[d] + (u === 1 && d !== 9 ? '-et-' : '-') + unites[10 + u];
      }
      if (u === 0) return dizaines[d] + (d === 8 ? 's' : '');
      if (u === 1 && d !== 8) return dizaines[d] + '-et-un';
      return dizaines[d] + '-' + unites[u];
    }
    if (num < 1000) {
      const c = Math.floor(num / 100);
      const reste = num % 100;
      let result = c === 1 ? 'cent' : unites[c] + ' cent';
      if (reste === 0 && c > 1) result += 's';
      else if (reste > 0) result += ' ' + convertirMoinsDeMillle(reste);
      return result;
    }
    return '';
  };

  const milliards = Math.floor(n / 1000000000);
  const millions = Math.floor((n % 1000000000) / 1000000);
  const milliers = Math.floor((n % 1000000) / 1000);
  const reste = n % 1000;

  let result = '';
  
  if (milliards > 0) {
    result += (milliards === 1 ? 'un milliard' : convertirMoinsDeMillle(milliards) + ' milliards');
    if (millions > 0 || milliers > 0 || reste > 0) result += ' ';
  }
  if (millions > 0) {
    result += (millions === 1 ? 'un million' : convertirMoinsDeMillle(millions) + ' millions');
    if (milliers > 0 || reste > 0) result += ' ';
  }
  if (milliers > 0) {
    result += (milliers === 1 ? 'mille' : convertirMoinsDeMillle(milliers) + ' mille');
    if (reste > 0) result += ' ';
  }
  if (reste > 0) {
    result += convertirMoinsDeMillle(reste);
  }

  return result.trim();
}

function nettoyerContenu(texte: string): string {
  return texte
    .replace(/^[\\s]*[-•*]\\s*/gm, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/#{1,6}\s*/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+|\s+$/g, '')
    .trim();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    // JWT Authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
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
        status: 401,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { 
      entrepriseNom, 
      entrepriseLogo,
      entrepriseAdresse,
      entrepriseTelephone,
      entrepriseEmail,
      clientNom,
      clientTelephone,
      clientEmail,
      description, 
      montant, 
      date,
      numeroFacture
    } = body;

    if (!clientNom || typeof clientNom !== "string" || !clientNom.trim() || clientNom.length > 200) {
      return new Response(JSON.stringify({ error: "Le nom du client est requis (max 200 caractères)" }), {
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    if (!montant || isNaN(Number(montant)) || Number(montant) <= 0 || Number(montant) > 999999999999) {
      return new Response(JSON.stringify({ error: "Le montant doit être un nombre positif valide" }), {
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    if (description && (typeof description !== "string" || description.length > 5000)) {
      return new Response(JSON.stringify({ error: "Description trop longue (max 5000 caractères)" }), {
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const montantNumerique = parseInt(String(montant).replace(/\s/g, ''), 10) || 0;
    const montantEnLettres = nombreEnLettres(montantNumerique);

    const systemPrompt = `Tu es un rédacteur d'élite spécialisé dans les documents commerciaux de prestige pour l'immobilier haut de gamme en Guinée.

PHILOSOPHIE D'ÉCRITURE :
Tu rédiges comme un notaire expérimenté : chaque mot est pesé, chaque phrase respire l'autorité et le professionnalisme.

RÈGLES DE STYLE ABSOLUES :
- Langage soutenu, élégant et juridiquement précis
- Phrases fluides et équilibrées (ni trop courtes, ni trop longues)
- Vocabulaire riche mais accessible
- Ton formel, respectueux et rassurant
- Rythme de lecture agréable avec des transitions naturelles

FORMAT STRICT :
- Trois paragraphes distincts, bien espacés
- Prose fluide uniquement (JAMAIS de listes, puces ou tirets)
- Aucun markdown, aucun caractère spécial
- Aucune répétition des données brutes (nom, montant chiffré)

INTERDICTIONS FORMELLES :
- Points de liste (•, -, *, →, numéros)
- Formatage markdown (**, ##, __)
- Formules banales ("Cher client", "Cordialement")
- Répétition des informations d'en-tête`;

    const userPrompt = `Rédige le corps textuel d'une facture immobilière de standing supérieur.

═══════════════════════════════════════
INFORMATIONS DE LA TRANSACTION
═══════════════════════════════════════
• Client : ${clientNom}
• Nature du service : ${description || 'Accompagnement et conseil immobilier professionnel'}
• Montant facturé : ${montant} GNF
• Montant en toutes lettres : ${montantEnLettres} francs guinéens
• Date d'émission : ${date}

═══════════════════════════════════════
STRUCTURE ATTENDUE (3 PARAGRAPHES)
═══════════════════════════════════════

【PARAGRAPHE 1 — Exposé de la prestation】
Décris avec élégance le service immobilier rendu. Évoque :
- La nature de l'accompagnement (conseil, intermédiation, expertise)
- La valeur ajoutée apportée au client
- Le professionnalisme de l'intervention
Rédige en 3-4 phrases fluides et connectées. Évite les tournures génériques.

【PARAGRAPHE 2 — Arrêté du montant】
Formule juridique consacrée :
"La présente facture est arrêtée à la somme de ${montantEnLettres} francs guinéens (${montant} GNF), représentant les honoraires convenus au titre de cette prestation."

【PARAGRAPHE 3 — Clause de validité】
Mention légale :
"Le présent document vaut facture originale et fait foi pour toutes fins légales, fiscales et comptables."

═══════════════════════════════════════
EXEMPLE DE QUALITÉ ATTENDUE
═══════════════════════════════════════

"Conformément au mandat qui nous a été confié, notre cabinet a assuré l'accompagnement intégral de votre projet immobilier. Cette mission a englobé l'évaluation technique du bien concerné, la conduite des négociations avec les parties prenantes, ainsi que le suivi rigoureux des formalités administratives jusqu'à leur parfait aboutissement. Notre expertise s'est exercée dans le respect des standards de qualité qui caractérisent notre engagement envers chaque client.

La présente facture est arrêtée à la somme de cinq cent mille francs guinéens (500 000 GNF), représentant les honoraires convenus au titre de cette prestation.

Le présent document vaut facture originale et fait foi pour toutes fins légales, fiscales et comptables."

═══════════════════════════════════════

Génère maintenant le texte adapté à cette prestation spécifique : "${description || 'Service de conseil et accompagnement immobilier'}".
Personnalise le premier paragraphe selon le contexte tout en conservant un ton premium.`;

    console.log('Generating premium invoice for:', clientNom, 'Amount:', montant, 'Amount in words:', montantEnLettres);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.5,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      
      if (response.status === 429) {
        throw new Error('Trop de requêtes. Veuillez réessayer dans quelques instants.');
      }
      if (response.status === 402) {
        throw new Error('Crédits API insuffisants.');
      }
      throw new Error(`Erreur API: ${response.status}`);
    }

    const data = await response.json();
    let generatedContent = data.choices?.[0]?.message?.content;

    if (!generatedContent) {
      throw new Error('Aucun contenu généré');
    }

    generatedContent = nettoyerContenu(generatedContent);

    console.log('Premium invoice generated successfully');

    return new Response(JSON.stringify({ content: generatedContent }), {
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error generating invoice:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la génération de la facture';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
