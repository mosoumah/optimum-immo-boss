

# Update ImmoPilot AI Assistant System Prompt

## What changes

Update the system prompt in `supabase/functions/chat-assistant/index.ts` (lines 391-402) to implement the comprehensive ImmoPilot persona with strict behavior rules.

## Plan

1. **Replace the system prompt** in the edge function with the full ImmoPilot specification:
   - Professional real estate assistant identity for "Optimum Immo"
   - Scope limitation: only real estate and business operations topics
   - Action confirmation flow: extract info → check completeness → ask if missing → show summary → wait for confirmation before executing
   - Formatted confirmation messages before any create action
   - Concise analysis responses with real data
   - Multi-language support (French/English based on user language)
   - Security reminder: only access data for current entreprise
   - Professional, efficient, calm personality — no casual or emotional tone

2. **No frontend changes needed** — the chatbot UI already renders messages properly.

3. **No tool changes needed** — existing tools already cover all listed capabilities (create_client, create_tache, create_facture, create_devis, search_clients, search_factures, search_reservations, analyze_finances, search_properties).

## Files impacted
- `supabase/functions/chat-assistant/index.ts` — system prompt update only (~lines 391-402)

