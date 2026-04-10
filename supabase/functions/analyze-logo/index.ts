import { getCorsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

;

serve(async (req) => {
  if (req.method === "OPTIONS") {
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

    const { logoUrl } = await req.json();
    
    if (!logoUrl || typeof logoUrl !== "string") {
      return new Response(
        JSON.stringify({ error: "Logo URL is required" }),
        { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Validate URL format
    try {
      const parsed = new URL(logoUrl);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        throw new Error("Invalid protocol");
      }
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid logo URL format" }),
        { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    if (logoUrl.length > 2048) {
      return new Response(
        JSON.stringify({ error: "URL too long" }),
        { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this logo image and extract the 3 most dominant colors that would work well for a professional invoice/document design.

Return ONLY a JSON object with exactly this format (no other text):
{
  "couleur_primaire": "#HEXCODE",
  "couleur_secondaire": "#HEXCODE", 
  "couleur_accent": "#HEXCODE"
}

Rules:
- couleur_primaire: The main/dominant brand color from the logo (for headers, titles)
- couleur_secondaire: A lighter complementary color (for backgrounds, subtle elements)
- couleur_accent: A contrasting color for emphasis (for text, important elements)
- All colors must be valid hex codes starting with #
- Ensure good contrast between colors for readability
- If the logo is mostly one color, derive complementary colors from it`
              },
              {
                type: "image_url",
                image_url: {
                  url: logoUrl
                }
              }
            ]
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later" }),
          { status: 429, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add credits" }),
          { status: 402, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log("AI response:", content);

    if (!content) {
      throw new Error("No content in AI response");
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Could not extract JSON from response:", content);
      return new Response(
        JSON.stringify({
          couleur_primaire: "#E97451",
          couleur_secondaire: "#FFF5F2",
          couleur_accent: "#1a1a2e"
        }),
        { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const colors = JSON.parse(jsonMatch[0]);
    
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    if (!hexRegex.test(colors.couleur_primaire) || 
        !hexRegex.test(colors.couleur_secondaire) || 
        !hexRegex.test(colors.couleur_accent)) {
      console.error("Invalid hex codes:", colors);
      return new Response(
        JSON.stringify({
          couleur_primaire: "#E97451",
          couleur_secondaire: "#FFF5F2",
          couleur_accent: "#1a1a2e"
        }),
        { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    console.log("Extracted colors:", colors);

    return new Response(
      JSON.stringify(colors),
      { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error analyzing logo:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        couleur_primaire: "#E97451",
        couleur_secondaire: "#FFF5F2",
        couleur_accent: "#1a1a2e"
      }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
