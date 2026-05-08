
# Plan — Chatbot Optimum Immo : expérience moderne type ChatGPT

Travail **strictement limité** au chatbot. Aucun changement au dashboard, réservations, revenus, permissions, notifications, RLS, edge functions ou backend.

## Fichiers concernés

- `src/hooks/useChatAssistant.tsx` — refactor de la logique d'envoi (queue, états par message, retry).
- `src/components/chat/AIChatBot.tsx` — remplacement de l'`<input>` par un `<textarea>` auto-expand, scroll intelligent, état "réfléchit".
- `src/components/chat/ChatMessage.tsx` — bulles premium, état d'erreur + bouton réessayer, séparateurs de date dans l'historique.

Aucun fichier hors `src/components/chat/**` et `src/hooks/useChatAssistant.tsx` ne sera touché.

## 1. Refactor du hook `useChatAssistant`

Nouveau modèle de message :

```ts
type MessageStatus = "sending" | "processing" | "completed" | "failed";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  status: MessageStatus;
  createdAt: string;
  error?: string;
}
```

Changements :
- `sendMessage` n'est **plus bloquant** : il pousse immédiatement le message user dans `messages` (status `sending`), puis traite via une **queue interne** (`useRef<Array>`).
- Un worker async dépile la queue en série : un seul appel IA en vol à la fois, mais l'utilisateur peut continuer à taper et empiler des messages.
- L'historique envoyé à l'edge function ne contient que les messages `completed` + le message en cours (les `failed` sont exclus, conformité avec l'edge actuel inchangée).
- Nouvel état dérivé `isAssistantThinking` (true tant qu'un message assistant est `processing`).
- Nouvelle fonction `retryMessage(id)` : remet en queue le message user lié à un assistant `failed`.
- En cas d'erreur réseau / 4xx / 5xx : le message user reste visible, un message assistant `failed` est ajouté avec `error` (jamais perdu).
- LocalStorage : on continue à sauvegarder uniquement les messages `completed` (on n'écrit pas les `failed`/`processing`).

## 2. Textarea auto-expand (`AIChatBot.tsx`)

Remplacer le `<input>` ligne 285 par un `<textarea>` contrôlé :
- `min-height: 48px`, `max-height: 220px`.
- Auto-resize via `useLayoutEffect` : reset `height = "auto"` puis `height = scrollHeight` capé à 220px.
- `overflow-y: auto` uniquement quand `scrollHeight > 220`.
- `Enter` = envoi, `Shift+Enter` = nouvelle ligne (`e.preventDefault()` sur Enter sans shift).
- L'input n'est **jamais désactivé** quand `isAssistantThinking` ; seul le bouton envoyer affiche un état loading visuel mais reste cliquable (push en queue).
- Bouton envoyer aligné en bas via `items-end` sur le conteneur flex.

## 3. Scroll intelligent

- Ref sur le viewport ScrollArea + flag `userScrolledUp` calculé via `onScroll` (seuil ~80px du bas).
- Auto-scroll vers le bas uniquement si `!userScrolledUp` OU si le **dernier message est du user** (l'envoi propre force toujours le scroll).
- Petit bouton flottant "↓ Nouveau message" qui apparaît quand `userScrolledUp && nouveau message assistant arrivé`.

## 4. Indicateur "Optimum Immo AI réfléchit…"

Étendre `TypingIndicator` :
- Garder les 3 dots animés.
- Ajouter le label `Optimum Immo AI réfléchit…` à côté, en `text-xs text-muted-foreground` avec animation `opacity` douce.

## 5. États visuels des messages (`ChatMessage.tsx`)

- `sending` (user) : bulle légèrement opaque + petit spinner discret en coin.
- `completed` : rendu actuel (conservé, identité visuelle Optimum Immo).
- `failed` (assistant) : bulle bordure rouge subtile, icône ⚠️, texte "Échec de la réponse" + bouton **Réessayer** (appelle `retryMessage`).
- Animations Framer Motion adoucies (déjà en place, on garde).

## 6. Historique : séparateurs de date

Dans l'onglet Historique de `AIChatBot.tsx` :
- Grouper `history` par date relative : "Aujourd'hui", "Hier", "Cette semaine", "Plus ancien".
- Petit header `text-[10px] uppercase tracking-wider text-muted-foreground` au-dessus de chaque groupe.
- Reprise de conversation inchangée (`loadConversation`).

## 7. Sécurité — inchangée

- `escapeHtml` toujours appliqué avant le rendu Markdown (déjà en place dans `ChatMessage.tsx`).
- Aucun changement à l'edge function `chat-assistant`, aux prompts système, aux RLS ni à l'isolation multi-entreprise.
- Pas de `dangerouslySetInnerHTML` sur du contenu non-échappé.
- Pas de nouveau secret, pas de nouvel appel réseau.

## 8. Performance

- `messages.map` keyé par `message.id` (stable) au lieu de l'index actuel → évite les re-renders inutiles des bulles.
- `ChatMessage` enveloppé dans `React.memo`.
- Throttle léger du handler `onScroll` (rAF).

## Hors scope (explicitement non touché)

- Edge function `chat-assistant`, CORS, prompts système.
- Dashboard, réservations, revenus, permissions, notifications, messagerie directe.
- Schéma DB, RLS, triggers.
- Identité visuelle globale (couleurs primary lime, gradients existants conservés).

## Validation

- Vérification visuelle du chatbot en preview : envoi de plusieurs messages rapides, écriture pendant la réponse, long texte (textarea grandit), scroll vers le haut puis nouveau message (pas de scroll forcé), simulation d'erreur (retry fonctionne).
- Console / network propres.
- Aucune régression sur les autres pages (smoke check rapide).
