

# Mise à jour du système de permissions — DONE

## Résumé
42 permissions au total (30 existantes + 12 nouvelles) réparties en 13 catégories.

## Nouvelles permissions ajoutées
| Catégorie | Permissions |
|-----------|------------|
| **Biens** | `creer_bien`, `voir_bien`, `modifier_bien`, `supprimer_bien` |
| **Réservations** | `creer_reservation`, `voir_reservation`, `modifier_reservation`, `supprimer_reservation` |
| **Studio IA** | `generer_image_ia`, `voir_image_ia`, `redesigner_bien_ia` |
| **Messagerie** | `envoyer_message` |

## Permissions par défaut
- **Admin** : toutes les 12 nouvelles permissions
- **Agent** : créer/voir/modifier biens, créer/voir/modifier réservations, générer/voir images IA, envoyer messages (pas supprimer, pas redesign)

## Fichiers modifiés
1. Migration SQL — ALTER TYPE + INSERT role_permissions
2. `src/hooks/usePermissions.tsx` — constantes mises à jour
3. `src/pages/Biens.tsx` — PermissionGate sur bouton "Nouveau bien"
4. `src/pages/Reservations.tsx` — PermissionGate sur bouton "Nouvelle réservation"
5. `src/pages/StudioIA.tsx` — PermissionGate sur boutons génération et redesign
6. `src/components/DirectMessagePanel.tsx` — PermissionGate sur zone d'envoi de message
