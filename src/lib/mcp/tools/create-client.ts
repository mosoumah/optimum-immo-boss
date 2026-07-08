import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function sb(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "create_client",
  title: "Créer un client",
  description: "Crée un nouveau client dans l'entreprise de l'utilisateur connecté.",
  inputSchema: {
    nom: z.string().trim().min(1).describe("Nom complet du client."),
    email: z.string().email().optional().describe("Email du client."),
    telephone: z.string().optional().describe("Numéro de téléphone."),
    adresse: z.string().optional().describe("Adresse."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ nom, email, telephone, adresse }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Non authentifié" }], isError: true };
    }
    const client = sb(ctx);

    // Récupère l'entreprise_id via le profil de l'utilisateur (RLS).
    const { data: profile, error: pErr } = await client
      .from("profiles")
      .select("entreprise_id")
      .eq("id", ctx.getUserId())
      .maybeSingle();
    if (pErr) return { content: [{ type: "text", text: pErr.message }], isError: true };
    if (!profile?.entreprise_id) {
      return { content: [{ type: "text", text: "Aucune entreprise associée à cet utilisateur." }], isError: true };
    }

    const { data, error } = await client
      .from("clients")
      .insert({ nom, email: email ?? null, telephone: telephone ?? null, adresse: adresse ?? null, entreprise_id: profile.entreprise_id })
      .select()
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Client créé: ${data.nom} (${data.id})` }],
      structuredContent: { client: data },
    };
  },
});
