

# Ajout d'une icone Messagerie dans la barre supérieure

## Objectif
Ajouter une icone de messagerie (MessageCircle) à côté de la cloche de notifications dans le header, qui ouvre directement le panneau `DirectMessagePanel` existant. L'icone affiche un badge avec le nombre de messages non lus.

## Fichiers à modifier

### 1. Nouveau composant : `src/components/MessageBell.tsx`
- Icone `MessageCircle` avec un badge compteur de messages non lus (style identique au `NotificationBell`)
- Au clic, ouvre le `DirectMessagePanel` (Sheet existant)
- Utilise un hook pour compter les messages non lus (`direct_messages` where `receiver_id = user.id AND read = false`)
- Souscription Realtime sur `direct_messages` pour mettre à jour le compteur en temps réel

### 2. `src/hooks/useUnreadMessages.tsx` (nouveau)
- Hook léger qui retourne `unreadCount` (nombre de messages directs non lus pour l'utilisateur courant)
- Query : `supabase.from('direct_messages').select('id', { count: 'exact' }).eq('receiver_id', user.id).eq('read', false)`
- Souscription Realtime sur INSERT/UPDATE de `direct_messages` pour rafraîchir le compteur

### 3. Pages à modifier (ajouter `<MessageBell />` à côté de `<NotificationBell />`)
- `src/pages/Dashboard.tsx` — ligne 185, ajouter `<MessageBell />` avant ou après `<NotificationBell />`
- `src/pages/StudioIA.tsx` — ligne 249, idem
- Toute autre page ayant le `NotificationBell` dans le header

### 4. `src/hooks/useDirectMessages.tsx`
- Ajouter une fonction `markConversationAsRead(userId)` qui met à jour `read = true` pour tous les messages reçus de cet utilisateur
- Appeler cette fonction quand on sélectionne un utilisateur dans le panneau

### 5. Migration SQL
- Activer Realtime sur `direct_messages` : `ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;`

## Ce qui ne change pas
- Le `DirectMessagePanel` existant (design, fonctionnement)
- La page Tâches garde son bouton Messagerie
- Aucun changement de design ou de routes

