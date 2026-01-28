

## Plan: Rendre le bouton "Assigner tâche" plus visible dans le TacheDetailDialog

### Probleme identifie

En analysant le code actuel et la capture d'ecran, le bouton "Assigner tache" existe bien dans le header du TacheDetailDialog (lignes 170-255), mais il y a deux problemes de visibilite:

1. **Texte masque sur mobile**: Le texte "Assigner tâche" utilise `hidden sm:inline`, ce qui le masque sur les petits ecrans et ne montre que l'icone
2. **Position discrete**: Le bouton est positionne dans le header a cote du titre, mais il peut passer inapercu

### Solution proposee

Modifier le header du TacheDetailDialog pour rendre le bouton "Assigner tâche" plus visible et accessible:

1. **Afficher le texte sur tous les ecrans** en retirant `hidden sm:inline`
2. **Ameliorer le style du bouton** pour le rendre plus prominent avec un effet glow vert
3. **Repositionner le bouton** dans une zone distincte sous le titre pour plus de visibilite

### Fichier a modifier

| Fichier | Modification |
|---------|--------------|
| `src/components/dialogs/TacheDetailDialog.tsx` | Ameliorer la visibilite du bouton "Assigner tâche" |

### Changement technique

**Avant (lignes 164-180):**
```tsx
<DialogHeader className="pb-4 border-b border-primary/20 ...">
  <div className="flex items-start justify-between gap-2">
    <DialogTitle className="text-lg font-semibold ...">
      {tache.titre}
    </DialogTitle>
    
    {/* Bouton dans le coin */}
    <Popover ...>
      <PopoverTrigger asChild>
        <Button size="sm" variant="outline" className="... shrink-0">
          <ClipboardList className="w-4 h-4" />
          <span className="hidden sm:inline">Assigner tâche</span>
        </Button>
      </PopoverTrigger>
      ...
    </Popover>
  </div>
  ...
</DialogHeader>
```

**Apres:**
```tsx
<DialogHeader className="pb-4 border-b border-primary/20 ...">
  <DialogTitle className="text-lg font-semibold ...">
    {tache.titre}
  </DialogTitle>
  
  <div className="flex flex-wrap items-center gap-2 ...">
    {/* Badges statut et date */}
    <Badge>À faire / Fait</Badge>
    <span>Date</span>
    {tache.assignee_name && <span>Assignee</span>}
  </div>
  
  {tache.description && <p>Description</p>}
  
  {/* Bouton Assigner tâche - maintenant plus visible */}
  <div className="pt-3">
    <Popover ...>
      <PopoverTrigger asChild>
        <Button className="gap-2 bg-primary/10 hover:bg-primary/20 ...">
          <ClipboardList className="w-4 h-4" />
          Assigner tâche
        </Button>
      </PopoverTrigger>
      ...
    </Popover>
  </div>
</DialogHeader>
```

### Ameliorations apportees

1. **Texte toujours visible**: Retrait de `hidden sm:inline` pour afficher "Assigner tâche" sur tous les ecrans
2. **Position distincte**: Le bouton est place dans sa propre zone sous la description, bien separe du titre
3. **Style ameliore**: Ajout d'un effet glow vert subtil pour attirer l'attention
4. **Taille adequate**: Bouton de taille normale au lieu de `size="sm"`

### Resultat visuel attendu

```text
┌─────────────────────────────────────────────────────────────────────┐
│  Organisation des visites pour les biens disponibles                │
│  🏷 À faire  •  28 janvier 2026  •  👤 Mamadou                       │
│                                                                     │
│  Planifier et coordonner les visites avec les clients...            │
│                                                                     │
│  [📋 Assigner tâche]  ← Bouton bien visible avec effet glow         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Zone de chat...                                                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Ce qui ne sera PAS modifie

- Le dashboard
- Les autres pages (Clients, Factures, Devis, etc.)
- Le DirectMessagePanel
- Le QuickTaskDialog
- La logique de selection des utilisateurs (popover existant)
- La zone de chat du TacheDetailDialog

