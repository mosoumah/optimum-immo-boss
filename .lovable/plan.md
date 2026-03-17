
# Improve Chatbot Header Visibility

## Problem
The chatbot header (avatar, "Assistant IA", status, greeting) blends into the dark background and isn't visually prominent enough.

## Changes — `src/components/chat/AIChatBot.tsx`

1. **Increase header contrast**: Add a brighter gradient background with a subtle bottom border glow to separate it from the chat body
2. **Enlarge the avatar**: Bump from `w-12 h-12` to `w-14 h-14` with a stronger ring glow
3. **Make "Assistant IA" title larger and bolder**: Increase font size to `text-base font-extrabold` with a green gradient text
4. **Enhance "En ligne" indicator**: Slightly larger dot with stronger pulse glow
5. **Add a subtle bottom border/glow line** to the header for clear visual separation from chat content
6. **Make the greeting text slightly larger** (`text-base`) so "Bonjour Mohamed 👋" stands out

## Files impacted
- `src/components/chat/AIChatBot.tsx` — header section (~lines 152-200)
