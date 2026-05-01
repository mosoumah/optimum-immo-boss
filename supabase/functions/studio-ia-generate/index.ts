import { getCorsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

;

const PLAN_LIMITS: Record<string, number> = {
  standard: 10,
  pro: 50,
  premium: 100,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Auth client for user context
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    // Service role client for storage and DB writes
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Get user entreprise_id
    const { data: profile } = await supabaseAuth.from("profiles").select("entreprise_id").eq("id", userId).single();
    if (!profile?.entreprise_id) {
      return new Response(JSON.stringify({ error: "Profil non trouvé" }), {
        status: 400,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    const entrepriseId = profile.entreprise_id;

    // Check and update quota
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    let { data: quota } = await supabaseAuth.from("studio_ia_quotas").select("*").eq("entreprise_id", entrepriseId).single();

    if (!quota) {
      // Create quota row
      const { data: newQuota, error: insertErr } = await supabaseAuth
        .from("studio_ia_quotas")
        .insert({ entreprise_id: entrepriseId, plan: "standard", generations_used: 0, month_year: currentMonth })
        .select()
        .single();
      if (insertErr) throw insertErr;
      quota = newQuota;
    }

    // Reset if month changed
    if (quota.month_year !== currentMonth) {
      await supabaseAuth
        .from("studio_ia_quotas")
        .update({ generations_used: 0, month_year: currentMonth, updated_at: new Date().toISOString() })
        .eq("id", quota.id);
      quota.generations_used = 0;
      quota.month_year = currentMonth;
    }

    const limit = PLAN_LIMITS[quota.plan] || 10;
    if (quota.generations_used >= limit) {
      return new Response(
        JSON.stringify({
          error: "Quota dépassé",
          message: `Vous avez atteint votre limite de ${limit} générations/mois (plan ${quota.plan}). Passez à un plan supérieur.`,
          quota: { used: quota.generations_used, limit, plan: quota.plan },
        }),
        { status: 403, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { type } = body;

    let resultImageUrl = "";

    if (type === "visual") {
      const { bien_description, prix, mention, include_logo, include_phone, format, entreprise_nom, entreprise_phone, couleur_primaire } = body;

      const dimension = format === "instagram_story" ? "1080x1920 (9:16 portrait story)" : "1080x1080 (1:1 square)";
      const priceText = prix ? `Prix affiché bien visible: ${prix}` : "Ne pas afficher de prix";
      const mentionText = mention || "Disponible";
      const phoneText = include_phone && entreprise_phone ? `Numéro de téléphone: ${entreprise_phone}` : "";
      const logoText = include_logo ? `Inclure le nom de l'agence: ${entreprise_nom || "Agence Immobilière"}` : "";
      const brandColor = couleur_primaire || "#E97451";

      const prompt = `Créer un visuel immobilier professionnel et premium pour les réseaux sociaux.
Format: ${dimension}
Style: Design moderne immobilier haut de gamme, élégant et professionnel.
Couleur d'accent de la marque: ${brandColor}

Bien immobilier: ${bien_description}

Éléments à inclure:
- Mention "${mentionText}" bien visible
- ${priceText}
- ${logoText}
- ${phoneText}
- Design épuré avec typographie moderne
- Fond sombre avec accents de couleur de la marque

L'image doit donner envie de visiter le bien. Ultra high resolution.`;

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [{ role: "user", content: prompt }],
          modalities: ["image", "text"],
        }),
      });

      if (!aiResponse.ok) {
        if (aiResponse.status === 429) {
          return new Response(JSON.stringify({ error: "Trop de requêtes, réessayez dans quelques instants." }), {
            status: 429,
            headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
          });
        }
        if (aiResponse.status === 402) {
          return new Response(JSON.stringify({ error: "Crédits IA insuffisants." }), {
            status: 402,
            headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
          });
        }
        const errText = await aiResponse.text();
        console.error("AI gateway error:", aiResponse.status, errText);
        throw new Error(`AI gateway error: ${aiResponse.status}`);
      }

      const aiData = await aiResponse.json();
      const imageBase64 = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (!imageBase64) {
        throw new Error("Aucune image générée par l'IA");
      }

      // Extract base64 data and upload to storage
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
      const fileName = `visuals/${entrepriseId}/${crypto.randomUUID()}.png`;

      const { error: uploadError } = await supabaseAdmin.storage.from("studio-ia").upload(fileName, imageBytes, {
        contentType: "image/png",
        upsert: false,
      });
      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabaseAdmin.storage.from("studio-ia").getPublicUrl(fileName);
      resultImageUrl = publicUrl.publicUrl;

      // Save to DB
      await supabaseAuth.from("ai_generated_images").insert({
        entreprise_id: entrepriseId,
        created_by: userId,
        format,
        prompt_used: prompt,
        image_url: resultImageUrl,
        bien_description,
        prix: prix || null,
        mention: mentionText,
        include_logo: include_logo || false,
        include_phone: include_phone || false,
      });
    } else if (type === "redesign") {
      const { original_image_url, instruction } = body;

      if (!original_image_url || !instruction) {
        return new Response(JSON.stringify({ error: "Image et instruction requises" }), {
          status: 400,
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }

      // Insert pending request
      const { data: request, error: reqErr } = await supabaseAuth
        .from("redesign_requests")
        .insert({
          entreprise_id: entrepriseId,
          created_by: userId,
          original_image_url,
          instruction,
          status: "pending",
        })
        .select()
        .single();
      if (reqErr) throw reqErr;

      const editPrompt = `Tu es un expert en design d'intérieur et immobilier de luxe. Modifie cette photo d'intérieur selon l'instruction suivante: "${instruction}". Le résultat doit être photoréaliste et professionnel. Ultra high resolution.`;

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: editPrompt },
                { type: "image_url", image_url: { url: original_image_url } },
              ],
            },
          ],
          modalities: ["image", "text"],
        }),
      });

      if (!aiResponse.ok) {
        await supabaseAuth.from("redesign_requests").update({ status: "failed" }).eq("id", request.id);
        if (aiResponse.status === 429) {
          return new Response(JSON.stringify({ error: "Trop de requêtes, réessayez dans quelques instants." }), {
            status: 429, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
          });
        }
        if (aiResponse.status === 402) {
          return new Response(JSON.stringify({ error: "Crédits IA insuffisants." }), {
            status: 402, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
          });
        }
        throw new Error(`AI gateway error: ${aiResponse.status}`);
      }

      const aiData = await aiResponse.json();
      const imageBase64 = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (!imageBase64) {
        await supabaseAuth.from("redesign_requests").update({ status: "failed" }).eq("id", request.id);
        throw new Error("Aucune image générée par l'IA");
      }

      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
      const fileName = `redesigns/${entrepriseId}/${crypto.randomUUID()}.png`;

      const { error: uploadError } = await supabaseAdmin.storage.from("studio-ia").upload(fileName, imageBytes, {
        contentType: "image/png",
        upsert: false,
      });
      if (uploadError) {
        await supabaseAuth.from("redesign_requests").update({ status: "failed" }).eq("id", request.id);
        throw uploadError;
      }

      const { data: publicUrl } = supabaseAdmin.storage.from("studio-ia").getPublicUrl(fileName);
      resultImageUrl = publicUrl.publicUrl;

      await supabaseAuth.from("redesign_requests").update({ result_image_url: resultImageUrl, status: "completed" }).eq("id", request.id);
    } else {
      return new Response(JSON.stringify({ error: "Type invalide. Utilisez 'visual' ou 'redesign'." }), {
        status: 400,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Increment quota
    await supabaseAuth
      .from("studio_ia_quotas")
      .update({ generations_used: quota.generations_used + 1, updated_at: new Date().toISOString() })
      .eq("id", quota.id);

    return new Response(
      JSON.stringify({
        success: true,
        image_url: resultImageUrl,
        quota: { used: quota.generations_used + 1, limit, plan: quota.plan },
      }),
      { status: 200, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("studio-ia-generate error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
