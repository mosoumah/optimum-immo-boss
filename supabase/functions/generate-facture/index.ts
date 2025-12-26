import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const systemPrompt = `Tu es un assistant professionnel spécialisé dans la création de factures immobilières en Guinée.
Tu génères des factures professionnelles, claires et bien structurées en français.

IMPORTANT:
- Génère uniquement du texte formaté, pas d'images
- Utilise un format professionnel adapté aux entreprises guinéennes
- Le montant doit être écrit en chiffres ET en lettres (en francs guinéens)
- Inclure tous les éléments légaux d'une facture
- Structure claire avec séparations visuelles (lignes, espaces)`;

    const userPrompt = `Génère une facture professionnelle avec les informations suivantes:

ENTREPRISE:
- Nom: ${entrepriseNom || 'Non spécifié'}
- Adresse: ${entrepriseAdresse || 'Non spécifiée'}
- Téléphone: ${entrepriseTelephone || 'Non spécifié'}
- Email: ${entrepriseEmail || 'Non spécifié'}

NUMÉRO DE FACTURE: ${numeroFacture || 'À générer'}

CLIENT:
- Nom: ${clientNom}
- Téléphone: ${clientTelephone || 'Non spécifié'}
- Email: ${clientEmail || 'Non spécifié'}

PRESTATION:
${description || 'Service immobilier'}

MONTANT: ${montant} GNF

DATE: ${date}

Instructions:
1. Titre "FACTURE" bien visible
2. Informations complètes de l'entreprise en en-tête
3. Numéro de facture
4. Informations du client
5. Description détaillée de la prestation
6. Montant en chiffres et en lettres
7. Date d'émission
8. Conditions de paiement
9. Zone pour signature et cachet

Génère la facture complète maintenant.`;

    console.log('Generating invoice for:', clientNom, 'Amount:', montant);

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
        temperature: 0.7,
        max_tokens: 2000,
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
    const generatedContent = data.choices?.[0]?.message?.content;

    if (!generatedContent) {
      throw new Error('Aucun contenu généré');
    }

    console.log('Invoice generated successfully');

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
