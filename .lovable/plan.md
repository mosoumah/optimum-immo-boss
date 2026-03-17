

# Icône chatbot : remplissage total + effet flottant premium

## Changements

### 1. Remplacer l'icône par la nouvelle image (face à l'utilisateur)
- Copier `user-uploads://Gemini_Generated_Image_hhkuzmhhkuzmhhku_1.png` → `src/assets/chatbot-icon.png`

### 2. `src/components/chat/AIChatBot.tsx` — Bouton flottant (lignes 100-121)

Refonte complète du bouton pour que l'icône remplisse le cercle et attire l'oeil :

- **Taille** : Agrandir le bouton à `w-20 h-20` et l'icône à `w-20 h-20` pour remplir totalement
- **Fond** : Supprimer le fond transparent, pas de cercle noir visible
- **Animation flottante** : Ajouter une animation `y: [0, -8, 0]` en boucle (Framer Motion `animate`) pour un effet de lévitation douce
- **Glow pulsante** : Double `drop-shadow` lime animé avec une pulsation (`animate` Framer Motion alternant entre deux intensités de glow)
- **Anneau orbital** : Conserver mais agrandir (`inset-[-6px]`), border plus visible (`border-primary/30`), rotation lente
- **Second anneau** : Ajouter un deuxième anneau orbital en sens inverse (`animate-[spin_12s_linear_infinite_reverse]`) pour un effet premium
- **Hover** : Scale à 1.12 avec glow intensifié

Aucun autre élément modifié.

