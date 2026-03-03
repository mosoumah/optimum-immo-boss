

# Audit de sécurité et bugs — Rapport complet

---

## SECTION 1 : FAILLES DE SECURITE CRITIQUES

### 1.1 — Edge Functions sans authentification (CRITIQUE)

4 Edge Functions n'effectuent **aucune vérification JWT/authentification** et sont accessibles publiquement par n'importe qui sur Internet :

| Fonction | Risque |
|----------|--------|
| `generate-document` | N'importe qui peut générer des documents IA gratuitement, consommant vos crédits Lovable AI |
| `generate-facture` | Idem — génération de factures sans authentification |
| `generate-devis` | Idem — génération de devis sans authentification |
| `suggest-tasks` | Idem — suggestions IA sans contrôle |
| `analyze-logo` | Idem — analyse de logo sans contrôle |

**Impact** : Un attaquant peut envoyer des milliers de requêtes et épuiser tous vos crédits IA. Il suffit de connaître l'URL de la fonction (`https://pldxyuesaachuhdfrfvh.supabase.co/functions/v1/generate-document`).

**Correction** : Ajouter la vérification JWT avec `getClaims()` comme c'est déjà fait dans `dashboard-ai-summary`, `studio-ia-generate`, `admin-create-user` et `admin-delete-user`.

---

### 1.2 — RLS Policies : notifications INSERT trop permissif (CRITIQUE)

La table `notifications` a une policy INSERT avec `WITH CHECK (true)`, ce qui signifie que **n'importe quel utilisateur authentifié** peut insérer des notifications pour **n'importe quel autre utilisateur**. Un agent malveillant pourrait spammer tous les utilisateurs avec de fausses notifications.

**Correction** : Restreindre l'INSERT aux triggers/fonctions SECURITY DEFINER uniquement, ou vérifier que `user_id = auth.uid()`.

---

### 1.3 — Protection contre les mots de passe compromis désactivée (MOYEN)

Le scan de sécurité a détecté que la **Leaked Password Protection** est désactivée. Les utilisateurs peuvent s'inscrire avec des mots de passe déjà compromis dans des fuites de données connues.

**Correction** : Activer cette option via la configuration d'authentification.

---

### 1.4 — CSS Injection dans document.write (FAIBLE)

Dans `Factures.tsx` et `Devis.tsx`, les couleurs de l'entreprise (`couleur_primaire`, `couleur_secondaire`, `couleur_accent`) sont injectées **directement dans le CSS** sans validation :

```javascript
.company-info h1 { color: ${accentColor}; }
```

Si un admin injecte une valeur comme `red; } body { display:none; } .x {`, cela casserait le document imprimé. Le risque est faible car seuls les admins contrôlent ces valeurs, mais une validation regex hex (`/^#[0-9A-Fa-f]{6}$/`) devrait être appliquée côté client avant injection.

---

### 1.5 — Pas de validation d'entrée sur le formulaire d'inscription (MOYEN)

`Inscription.tsx` n'a aucune validation côté client :
- Pas de longueur minimale pour le mot de passe
- Pas de validation de format d'email
- Pas de limite de longueur pour le nom/entreprise
- Seul `required` est utilisé sur les inputs HTML

**Correction** : Ajouter une validation avec `zod` (minimum 8 caractères pour le mot de passe, format email, longueur max des champs).

---

## SECTION 2 : BUGS FONCTIONNELS

### 2.1 — Avertissement React : ref sur Badge (composant fonctionnel)

Le console log montre :
```
Function components cannot be given refs — Check DirectMessagePanel
```
Le composant `Badge` reçoit une ref mais n'utilise pas `forwardRef`. Cela ne casse pas l'application mais génère un avertissement en continu.

**Correction** : Soit ne pas passer de ref au Badge, soit wrapper Badge avec `forwardRef`.

---

### 2.2 — Missing `Description` dans SheetContent (MessageBell)

Le console log signale :
```
Missing Description or aria-describedby for DialogContent
```
Le `SheetContent` dans `MessageBell.tsx` n'a pas de `SheetDescription`, ce qui est un problème d'accessibilité.

**Correction** : Ajouter un `<SheetHeader>` avec `<SheetTitle>` et `<SheetDescription>` (même visuellement caché avec `sr-only`).

---

### 2.3 — N+1 queries dans useDirectMessages

La fonction `fetchUsers` effectue une requête séparée pour chaque profil pour obtenir son rôle (boucle `for...of` sur profiles, ligne 55-63). Avec 50 utilisateurs, cela fait 51 requêtes au lieu de 2.

**Correction** : Effectuer une seule requête sur `user_roles` avec `.in("user_id", profileIds)` puis mapper côté client.

---

### 2.4 — Profils visibles uniquement par l'admin dans la messagerie

La RLS sur `profiles` ne permet la lecture que pour `id = auth.uid()` OU si l'utilisateur est admin. Un **agent** qui ouvre la messagerie ne peut pas voir les profils des autres utilisateurs (sauf le sien), donc la liste des contacts sera **vide** pour les agents.

**Correction** : Ajouter une policy SELECT sur `profiles` qui permet aux utilisateurs authentifiés de voir les profils de leur même entreprise (au minimum `id` et `nom`), ou créer une vue restreinte.

---

### 2.5 — MessageBell absent de la plupart des pages

Le `MessageBell` n'est ajouté que dans `Dashboard.tsx` et `StudioIA.tsx`. Il manque sur toutes les autres pages : Clients, Biens, Reservations, Factures, Devis, Taches, DocumentsIA, Depenses, Revenus, Parametres, Utilisateurs, GestionPermissions.

---

## SECTION 3 : RESUME PRIORITISE

| # | Sévérité | Problème | Fichier(s) |
|---|----------|----------|------------|
| 1 | **CRITIQUE** | 5 Edge Functions sans auth — crédits IA exposés | `generate-document`, `generate-facture`, `generate-devis`, `suggest-tasks`, `analyze-logo` |
| 2 | **CRITIQUE** | Notifications INSERT `WITH CHECK (true)` | RLS policy sur `notifications` |
| 3 | **HAUTE** | Profils non visibles par les agents (messagerie cassée) | RLS policy sur `profiles` |
| 4 | **MOYENNE** | Leaked Password Protection désactivée | Config auth |
| 5 | **MOYENNE** | Pas de validation formulaire inscription | `Inscription.tsx` |
| 6 | **FAIBLE** | CSS injection dans document.write (couleurs) | `Factures.tsx`, `Devis.tsx` |
| 7 | **BUG** | N+1 queries dans messagerie | `useDirectMessages.tsx` |
| 8 | **BUG** | Missing aria-describedby dans MessageBell | `MessageBell.tsx` |
| 9 | **BUG** | Ref warning sur Badge | `DirectMessagePanel.tsx` |
| 10 | **BUG** | MessageBell absent sur la majorité des pages | Toutes les pages sauf Dashboard et StudioIA |

