// MCP tools run inside the Supabase Edge (Deno) runtime, not the Vite browser bundle.
// Declare `process.env` so the TS project check accepts these Deno-scoped files.
declare const process: { env: Record<string, string | undefined> };
