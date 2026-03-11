

# Remplacement de l'icône du chatbot

## Changements

### 1. Copier la nouvelle icône
- `user-uploads://Gemini_Generated_Image_7n4qio7n4qio7n4q_-_Edited.png` → `src/assets/chatbot-icon.png` (écrase l'ancienne)

### 2. `src/components/chat/AIChatBot.tsx` — Bouton flottant (lignes 110-119)
- Supprimer le fond noir du bouton : remplacer le `background: linear-gradient(145deg, hsl(220, 18%, 14%), hsl(220, 20%, 8%))` par `background: transparent`
- Supprimer la bordure sombre (`border: "1px solid ..."`)
- Agrandir l'icône pour qu'elle remplisse tout le bouton : `w-9 h-9` → `w-14 h-14`
- Conserver le glow vert en `boxShadow` et l'anneau orbital pour l'effet premium
- Le bouton devient essentiellement l'icône elle-même, sans cadre noir autour

### 3. Header du chat (icône dans le header)
- Même icône mise à jour automatiquement via l'import

Aucun autre fichier modifié.

