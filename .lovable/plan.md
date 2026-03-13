

# Amélioration icône dashboard + agrandissement et redesign premium du chatbot

## Changements

### 1. Bouton flottant dashboard (`AIChatBot.tsx` ~ligne 125-131)
- Appliquer le même traitement que l'interface : `rounded-full overflow-hidden` + `object-cover object-center scale-[1.22]` + `ring-1 ring-primary/25`
- Remplacer `object-contain` par `object-cover` pour remplir le cercle proprement

### 2. Agrandir l'interface chatbot (`AIChatBot.tsx` ~ligne 143)
- Passer de `w-[400px] h-[580px]` à `w-[440px] h-[640px]` pour plus d'espace

### 3. Redesign premium de l'interface chatbot

**Header** (~lignes 151-202) :
- Réduire l'icône header de `w-16 h-16` à `w-12 h-12` (plus proportionnel avec la nouvelle taille)
- Ajouter un séparateur glow subtil en bas du header
- Titre "Assistant IA" en taille légèrement plus grande avec gradient text

**Onglets** (~lignes 210-227) :
- Style plus raffiné : fond plus sombre, bordure arrondie plus prononcée, hauteur légèrement augmentée

**Zone suggestions** (~lignes 236-251) :
- Passer à un layout plus aéré avec icônes légèrement plus grandes
- Ajouter un léger gradient de fond au hover

**Zone input** (~lignes 265-287) :
- Input plus grand (h-10), coins plus arrondis
- Bouton d'envoi avec gradient plus prononcé et glow au hover
- Ajouter un texte "Propulsé par IA" discret sous l'input

**Messages** (`ChatMessage.tsx`) :
- Bulles IA : ajouter un léger gradient de fond au lieu du simple `bg-card`
- Coins des bulles plus différenciés (rounded-2xl + rounded-tl-sm pour IA, rounded-tr-sm pour user)

**Historique** (~lignes 301-339) :
- Icône de conversation avec un léger gradient
- Hover plus visible avec glow subtil

### Fichiers modifiés
- `src/components/chat/AIChatBot.tsx`
- `src/components/chat/ChatMessage.tsx`

