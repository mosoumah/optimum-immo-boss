

# AI Assistant Chatbot for Dashboard

## Architecture

### 1. Backend: Edge Function `chat-assistant`
A new edge function that receives user messages with conversation history, determines intent (create, analyze, search), and either:
- **Creates records** by inserting directly into the database (reservations, clients, factures, devis, taches) scoped to `entreprise_id`
- **Analyzes data** by querying views/tables and returning formatted answers
- **Searches data** by querying relevant tables with filters

The function uses Lovable AI (gemini-3-flash-preview) with tool calling to determine user intent and extract parameters. The AI decides which tool to call, and the function executes the corresponding database operation.

**Tools exposed to the AI:**
- `create_client(nom, email?, telephone?)`
- `create_reservation(client_id, property_id, date_arrivee, date_depart, type_location)`
- `create_facture(client_id, montant, description?)`
- `create_devis(client_id, montant, description?)`
- `create_tache(titre, description?)`
- `search_clients(query?)`
- `search_factures(statut?)`
- `search_reservations(period?)`
- `analyze_finances(metric)` — queries `v_dashboard_simple` and `v_dashboard_advanced_finance`
- `search_properties(statut?)`

All operations filter by `entreprise_id` from the authenticated user's profile.

### 2. Frontend Components

**`src/components/chat/AIChatBot.tsx`** — Main floating button + chat window
- Floating button: bottom-right, lime/green gradient, pulsing glow, `MessageSquare` icon
- Chat window: ~400px wide, ~550px tall, dark card style matching dashboard theme
- Header with user greeting, close button
- Two tabs: "Discussion" / "Historique"
- Suggested action chips below greeting
- Message list with markdown rendering
- Input field + send button
- Streaming response display

**`src/components/chat/ChatMessage.tsx`** — Individual message bubble (user vs assistant styling)

**`src/hooks/useChatAssistant.tsx`** — Hook managing conversation state, streaming, history (localStorage for past conversations)

### 3. Integration
- Import `AIChatBot` in `Dashboard.tsx` and render it at the root level (outside main content, inside the outer div)
- Pass `profile.nom` and `entreprise_id` as props

### 4. Config
- Add `[functions.chat-assistant]` with `verify_jwt = false` to `supabase/config.toml`

## Files to create
- `supabase/functions/chat-assistant/index.ts`
- `src/components/chat/AIChatBot.tsx`
- `src/components/chat/ChatMessage.tsx`
- `src/hooks/useChatAssistant.tsx`

## Files to modify
- `src/pages/Dashboard.tsx` — add `<AIChatBot />` component
- `supabase/config.toml` — add function entry

## Security
- JWT validation in edge function via `supabase.auth.getUser()`
- All DB queries scoped to user's `entreprise_id`
- No cross-company data exposure

