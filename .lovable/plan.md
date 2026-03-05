

# Diagnostic et corrections du formulaire de documents IA

## Problemes identifies

### 1. `DatePickerField` ne forward pas les refs (warning React)
Le composant `DatePickerField` est utilise a l'interieur d'un `PopoverTrigger asChild` qui tente de passer un ref. Comme c'est un composant fonction simple, React leve un warning. Cela peut provoquer des comportements inattendus avec les Popover (calendriers qui ne se ferment pas correctement, superposition qui bloque les clics).

### 2. Potentiel blocage par le Popover du calendrier
Quand l'utilisateur ouvre un DatePicker (date de creation ou date de signature), le Popover cree une couche de superposition. Si cette couche ne se ferme pas correctement apres selection, elle peut intercepter les clics sur le bouton "Generer avec l'IA" situe plus bas dans le formulaire.

### 3. Edge function — fonctionne correctement
Test via curl confirme que la fonction edge `generate-document` repond correctement (status 200, contenu genere). Le probleme est exclusivement cote frontend.

## Corrections

### Fichier : `src/components/dialogs/DocumentDialog.tsx`

1. **Convertir `DatePickerField` en composant avec `forwardRef`** pour eliminer le warning React et garantir le bon fonctionnement des Popover.

2. **Ajouter `modal={true}`** sur les Popover des DatePicker pour s'assurer qu'ils se ferment proprement et ne bloquent pas les interactions avec le reste du formulaire.

3. **Ajouter une fermeture explicite du Popover** apres selection d'une date (via un state `open` controle) pour eviter que le calendrier reste ouvert et bloque le bouton.

Aucune modification sur l'edge function ni sur le PDF.

