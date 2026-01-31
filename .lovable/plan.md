

## Plan : Aligner la structure de GestionPermissions sur celle de Utilisateurs

### Problème identifié

La page **Gestion des Permissions** n'est pas centrée comme la page **Utilisateurs** car :

1. **Structure différente** : Le `<main>` a un `p-8` direct, alors que Utilisateurs utilise un wrapper `<div className="p-8">` à l'intérieur
2. **Marge non responsive** : `ml-64` au lieu de `lg:ml-64`
3. **Pas de header sticky** : La page Utilisateurs a un header avec barre de recherche, la page Permissions n'en a pas

### Fichier à modifier

- `src/pages/GestionPermissions.tsx`

### Changements précis

**1. Conteneur racine (ligne 225)**

Avant :
```tsx
<div className="min-h-screen flex relative">
```

Après :
```tsx
<div className="min-h-screen flex relative overflow-x-hidden">
```

**2. Élément `<main>` (ligne 229)**

Avant :
```tsx
<main className="flex-1 ml-64 mesh-gradient min-h-screen p-8">
```

Après :
```tsx
<main className="flex-1 lg:ml-64 mesh-gradient min-h-screen">
```

- Suppression du `p-8` sur le main (sera mis sur un wrapper interne)
- Ajout de `lg:` pour rendre la marge responsive

**3. Wrapper du contenu (ligne 230)**

Avant :
```tsx
<div className="max-w-6xl mx-auto relative z-10">
```

Après :
```tsx
<div className="p-4 lg:p-8">
  <div className="max-w-6xl mx-auto relative z-10">
```

- Ajout d'un wrapper avec padding responsive `p-4 lg:p-8`
- Le contenu reste centré avec `max-w-6xl mx-auto`

**4. Fermeture du nouveau wrapper**

Ajouter une fermeture `</div>` avant la fermeture du `</main>` (ligne 392)

### Résultat attendu

- Le contenu sera centré au milieu comme sur la page Utilisateurs
- La page sera responsive sur mobile (pas de marge fixe qui coupe le contenu)
- Structure alignée avec les autres sections de l'application

### Ce qui ne sera PAS modifié

- Aucune autre page
- Aucun style global
- Aucune fonctionnalité

