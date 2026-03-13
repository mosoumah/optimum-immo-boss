
Objectif
- Corriger définitivement l’affichage de l’icône dans l’interface du chatbot (fenêtre ouverte), pour qu’elle paraisse plus grande, nette et “premium”, sans remplissage noir.
- Ne rien modifier au dashboard hors chatbot.

Plan de mise en œuvre
1) Uniformiser le rendu de l’icône dans l’interface chatbot
- Fichiers ciblés : `src/components/chat/AIChatBot.tsx` et `src/components/chat/ChatMessage.tsx`.
- Appliquer le même pattern visuel aux 3 emplacements :
  - en-tête du chatbot,
  - avatar des messages IA,
  - avatar du “typing indicator”.

2) Faire “remplir le cercle” visuellement (même si le PNG a du padding transparent)
- Garder un conteneur circulaire `rounded-full overflow-hidden`.
- Passer l’image en `w-full h-full object-cover` + légère mise à l’échelle (`scale-[1.18]` à `scale-[1.28]`) pour compenser les marges transparentes du fichier.
- Centrer parfaitement avec `object-center` pour conserver les détails du logo.

3) Augmenter la visibilité sans fond noir
- Augmenter légèrement les tailles dans l’interface ouverte :
  - en-tête: ~64px,
  - messages/typing: ~44–48px.
- Ajouter un ring propre (fin) + glow subtil lime (pas de disque noir derrière), pour un rendu premium.

4) Nettoyage cohérence visuelle
- Supprimer toute classe restante qui pourrait créer un fond sombre autour de l’icône dans la fenêtre du chatbot.
- Conserver les animations actuelles, sans surcharge.

Détails techniques (pour implémentation)
- `AIChatBot.tsx`
  - Header icon wrapper: `rounded-full overflow-hidden ring-1 ring-primary/25`.
  - Header image: `w-full h-full object-cover object-center scale-[1.22]`.
  - Typing indicator: même logique avec taille plus petite.
- `ChatMessage.tsx`
  - Avatar IA: même wrapper circulaire + même stratégie `object-cover + scale`.
- Harmoniser le glow sur les 3 emplacements pour éviter des différences visuelles.

Validation attendue
- Dans la fenêtre chatbot ouverte, l’icône est clairement plus grande et lisible.
- L’icône remplit visuellement le cercle (plus d’effet “miniature”).
- Aucun remplissage noir visible.
- Aucun changement hors zone chatbot.
