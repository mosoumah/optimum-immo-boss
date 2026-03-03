

# Mise à jour du système de permissions

## Constat
Le système actuel couvre 30 permissions réparties en 9 catégories. Mais plusieurs modules ajoutés depuis n'ont aucune permission associée, ce qui signifie que tout utilisateur avec le rôle "agent/utilisateur" peut y accéder sans contrôle de l'admin.

## Modules sans permissions actuellement
| Module | Actions manquantes |
|--------|-------------------|
| **Biens** | Créer, voir, modifier, supprimer un bien |
| **Réservations** | Créer, voir, modifier, supprimer une réservation |
| **Studio IA** | Générer une image, voir les images, redesigner un bien |
| **Messagerie** | Envoyer des messages directs |

## Plan d'implémentation

### 1. Migration SQL — Ajouter les nouvelles permissions à l'enum
Ajouter 12 nouvelles valeurs à l'enum `app_permission` :
- `creer_bien`, `voir_bien`, `modifier_bien`, `supprimer_bien`
- `creer_reservation`, `voir_reservation`, `modifier_reservation`, `supprimer_reservation`
- `generer_image_ia`, `voir_image_ia`, `redesigner_bien_ia`
- `envoyer_message`

Puis insérer les permissions par défaut dans `role_permissions` pour les rôles `admin` (toutes) et `agent` (un sous-ensemble raisonnable : voir/créer mais pas supprimer, pas redesign, etc.).

### 2. Mettre à jour `usePermissions.tsx`
- Ajouter les 12 nouvelles permissions à `ALL_PERMISSIONS`
- Ajouter 4 nouvelles catégories dans `PERMISSION_CATEGORIES` : Biens, Réservations, Studio IA, Messagerie
- Ajouter les labels français dans `PERMISSION_LABELS`

### 3. Appliquer les `PermissionGate` dans les pages concernées
- **`Biens.tsx`** : gater le bouton "Ajouter un bien" avec `creer_bien`, etc.
- **`Reservations.tsx`** : gater le bouton "Nouvelle réservation" avec `creer_reservation`, etc.
- **`StudioIA.tsx`** : gater la génération avec `generer_image_ia`, le redesign avec `redesigner_bien_ia`
- **`DirectMessagePanel.tsx`** : gater l'envoi avec `envoyer_message`

### 4. Fichiers modifiés
1. **Migration SQL** — nouvel ALTER TYPE + INSERT role_permissions
2. **`src/hooks/usePermissions.tsx`** — nouvelles constantes
3. **`src/pages/Biens.tsx`** — PermissionGate
4. **`src/pages/Reservations.tsx`** — PermissionGate
5. **`src/pages/StudioIA.tsx`** — PermissionGate
6. **`src/components/DirectMessagePanel.tsx`** — PermissionGate

Aucun changement de design, de structure de routes, ni de logique existante.

