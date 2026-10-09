declare const process: { env: Record<string, string | undefined> };
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
  name: "list_factures",
  title: "Lister les factures",
  description: "Liste les factures de l'entreprise de l'utilisateur connecté.",
  inputSchema: {
    statut: z.enum(["brouillon", "envoyee", "paye", "en_retard", "annulee"]).optional(),
    limit: z.number().int().min(1).max(100).default(20),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ statut, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Non authentifié" }], isError: true };
    }
    // Récupère l'entreprise_id via le profil de l'utilisateur (RLS).
    const client = sb(ctx);
    const { data: profile, error: pErr } = await client
      .from("profiles")
      .select("entreprise_id")
      .eq("id", ctx.getUserId())
      .maybeSingle();
    if (pErr) return { content: [{ type: "text", text: pErr.message }], isError: true };
    if (!profile?.entreprise_id) {
      return { content: [{ type: "text", text: "Aucune entreprise associée à cet utilisateur." }], isError: true };
    }

    let q = client
      .from("factures")
      .select("*")
      .eq("entreprise_id", profile.entreprise_id)
      .order("date", { ascending: false })
      .limit(limit);
    if (statut) q = q.eq("statut", statut);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { factures: data ?? [] },
    };
  },
});
