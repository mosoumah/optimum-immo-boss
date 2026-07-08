import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listClientsTool from "./tools/list-clients";
import listPropertiesTool from "./tools/list-properties";
import listReservationsTool from "./tools/list-reservations";
import listFacturesTool from "./tools/list-factures";
import createClientTool from "./tools/create-client";

// L'issuer OAuth DOIT être l'hôte Supabase direct (jamais le proxy .lovable.cloud).
// On le construit depuis le project ref, inliné par Vite au build.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "optimum-immo-mcp",
  title: "Optimum Immo MCP",
  version: "0.1.0",
  instructions:
    "Outils pour Optimum Immo. Chaque appel agit en tant que l'utilisateur connecté et respecte les permissions par entreprise (RLS).",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listClientsTool,
    listPropertiesTool,
    listReservationsTool,
    listFacturesTool,
    createClientTool,
  ],
});
