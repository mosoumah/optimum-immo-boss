import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fonction de conversion du montant en lettres (français)
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

// Fonction de nettoyage du contenu généré
function nettoyerContenu(texte: string): string {
  return texte
    .replace(/^[\s]*[-•*]\s*/gm, '') // Supprimer les puces en début de ligne
    .replace(/\*\*/g, '') // Supprimer le markdown bold
    .replace(/\*/g, '') // Supprimer les astérisques
    .replace(/#{1,6}\s*/g, '') // Supprimer les titres markdown
    .replace(/\n{3,}/g, '\n\n') // Limiter les sauts de ligne
    .replace(/^\s+|\s+$/g, '') // Trim
    .trim();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Convertir le montant en lettres
    const montantNumerique = parseInt(String(montant).replace(/\s/g, ''), 10) || 0;
    const montantEnLettres = nombreEnLettres(montantNumerique);

    const systemPrompt = `Tu es un expert en rédaction de documents commerciaux haut de gamme pour les agences immobilières en Guinée.

STYLE D'ÉCRITURE :
- Langage professionnel, formel et élégant
- Phrases claires et concises
- Vocabulaire juridique approprié mais accessible
- Ton respectueux et courtois

FORMAT OBLIGATOIRE :
- Génère UNIQUEMENT le détail de la prestation (pas de titre FACTURE, pas d'en-tête, pas d'informations entreprise)
- Structure en paragraphes fluides, SANS puces ni tirets ni astérisques
- Espacement logique entre les idées
- Pas de markdown, pas de caractères spéciaux

INTERDICTIONS STRICTES :
- Pas de points de liste (•, -, *, →)
- Pas de markdown (**, ##, etc.)
- Pas de répétition des informations déjà présentes (nom client, montant chiffré, date)
- Pas de formules génériques ("Cher client", "Cordialement", "Merci")
- Pas d'en-tête de facture (le design s'en charge)`;

    const userPrompt = `Rédige le détail de la prestation pour une facture immobilière professionnelle.

DONNÉES DE LA PRESTATION :
Client : ${clientNom}
Description : ${description || 'Service de conseil et accompagnement immobilier'}
Montant : ${montant} GNF
Montant en lettres : ${montantEnLettres} francs guinéens
Date : ${date}

STRUCTURE ATTENDUE (en 3 paragraphes séparés) :

PARAGRAPHE 1 - Description élégante de la prestation :
Décris le service rendu de manière professionnelle en 2-3 phrases. Mentionne le type de service immobilier, l'accompagnement fourni, et la valeur ajoutée apportée au client.

PARAGRAPHE 2 - Montant arrêté :
"La présente facture est arrêtée à la somme de ${montantEnLettres} francs guinéens (${montant} GNF), correspondant aux honoraires convenus pour cette prestation."

PARAGRAPHE 3 - Clause de validité :
"Ce document constitue une facture originale et fait foi pour toutes fins légales et comptables."

EXEMPLE DE RENDU PARFAIT :
"Dans le cadre de notre collaboration, nous avons assuré l'accompagnement complet pour votre projet immobilier. Notre intervention a couvert l'ensemble des démarches nécessaires, incluant l'évaluation du bien, les négociations avec les parties concernées, ainsi que la coordination administrative jusqu'à la finalisation du dossier.

La présente facture est arrêtée à la somme de cinq cent mille francs guinéens (500 000 GNF), correspondant aux honoraires convenus pour cette prestation.

Ce document constitue une facture originale et fait foi pour toutes fins légales et comptables."

Maintenant, génère le texte pour cette prestation spécifique. Adapte le premier paragraphe selon la description fournie : "${description || 'Service immobilier'}". Ne répète PAS le mot "Description" ou les informations brutes.`;

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

    // Nettoyer le contenu généré
    generatedContent = nettoyerContenu(generatedContent);

    console.log('Premium invoice generated successfully');

    return new Response(JSON.stringify({ content: generatedContent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error generating invoice:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la génération de la facture';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
