

## Plan: Correction de l'avertissement React ref dans Utilisateurs.tsx

### Probleme identifie

L'erreur dans la console provient de la page `Utilisateurs.tsx` ou le composant `DropdownMenu` (Radix UI) tente de recevoir une ref alors qu'il n'utilise pas `forwardRef`. Bien que cela soit un avertissement benin qui n'affecte pas le fonctionnement, il est preferable de le corriger pour avoir une console propre.

### Cause

Le composant `DropdownMenu` de Radix UI est utilise directement dans une cellule de table (`<td>`). Radix UI essaie parfois de passer une ref au composant enfant direct, ce qui genere l'avertissement.

### Solution

Envelopper le `DropdownMenu` dans un `div` ou `span` pour eviter le probleme de ref. Cela isole le composant Radix du contexte direct de la table.

### Fichier a modifier

| Fichier | Modification |
|---------|--------------|
| `src/pages/Utilisateurs.tsx` | Envelopper le DropdownMenu dans un conteneur `div` |

### Changement technique

**Avant (ligne 542-556):**
```tsx
<td className="p-4 text-right">
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon">
        <MoreVertical className="w-4 h-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem className="text-destructive">
        <Trash2 className="w-4 h-4 mr-2" />
        Supprimer
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</td>
```

**Apres:**
```tsx
<td className="p-4 text-right">
  <div className="flex justify-end">
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem className="text-destructive">
          <Trash2 className="w-4 h-4 mr-2" />
          Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</td>
```

### Resume du diagnostic

| Element | Statut |
|---------|--------|
| Table `direct_messages` | OK - creee avec RLS |
| Table `tache_messages` | OK - fonctionne |
| Messagerie directe | OK - messages envoyes/recus |
| Creation de taches rapides | OK - fonctionnel |
| Notifications | OK - creees automatiquement |
| Requetes API | OK - status 200 |
| Warning React ref | A corriger (benin) |

### Ce qui ne sera PAS modifie

- Le dashboard
- Le DirectMessagePanel
- Le TacheDetailDialog
- Le QuickTaskDialog
- Toutes les autres pages

