

# Remplacement icône chatbot + correction monnaie GNF

## Changements

### 1. Copier la nouvelle icône officielle
- `user-uploads://f40b1910-163d-4e44-992e-9963e357a09a.png` → `src/assets/chatbot-icon.png` (écrase l'ancienne)
- Les deux fichiers qui importent cette icône (`AIChatBot.tsx` et `ChatMessage.tsx`) l'utiliseront automatiquement

### 2. Correction de la monnaie dans `supabase/functions/chat-assistant/index.ts`
- **Ligne 400** : Remplacer `"Pour les montants, utilise le format: X DH (dirham)."` par `"Pour les montants, utilise le format: X GNF (franc guinéen)."`
- Redéploiement automatique de la fonction

Aucun autre fichier ou élément modifié.

