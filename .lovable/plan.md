

# Fix: Chatbot se mélange avec le dashboard

## Problème
La fenêtre du chatbot utilise des fonds semi-transparents (`backdrop-blur`, gradients avec opacité faible) qui laissent voir le dashboard en dessous. Le contenu du dashboard est visible à travers le chatbot, rendant les deux indistinguables.

## Solution
Rendre le fond du chatbot **complètement opaque** tout en conservant le style premium :

### `src/components/chat/AIChatBot.tsx`
- **Fenêtre principale** (ligne 132-138) : Remplacer le background semi-transparent par un fond opaque solide (`hsl(220, 20%, 9%)` → `hsl(220, 25%, 5%)`) sans transparence
- **Header** (ligne 141) : Remplacer `hsl(220, 18%, 12%, 0.8)` par une valeur opaque `hsl(220, 18%, 12%)`
- **Suggestions, input, messages** : Remplacer tous les `bg-card/30`, `bg-card/40`, `bg-card/60` par des valeurs opaques (`bg-card` ou couleurs solides)
- **Tabs** : `bg-card/40` → fond opaque
- **ScrollArea et conteneurs internes** : S'assurer qu'aucun `backdrop-blur-sm` ne crée de transparence sur le contenu

Le résultat : un chatbot visuellement distinct, opaque, flottant au-dessus du dashboard avec un contraste net.

