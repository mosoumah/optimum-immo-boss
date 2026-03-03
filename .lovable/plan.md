

# Mise a jour automatique du dashboard et du statut des biens

## Problemes identifies

1. **Arrivees aujourd'hui** : La vue `v_dashboard_simple` filtre les arrivees sur `statut = 'confirmee'` uniquement, ce qui est correct. Mais il manque le compteur **"Sejours en cours"** que l'utilisateur demande.
2. **Statut des biens** : Quand une reservation est creee, le bien reste "disponible" au lieu de passer a "reserve". Et quand le sejour est termine, le bien ne revient pas a "disponible".

## Modifications

### 1. Migration SQL : ajouter "sejours en cours" a la vue et creer un trigger pour le statut des biens

**a) Mettre a jour `v_dashboard_simple`** pour ajouter un compteur `sejours_en_cours` :
- Compter les reservations avec `statut = 'en_cours'` OU les reservations confirmees dont la date d'arrivee est passee ou aujourd'hui et la date de depart est dans le futur.

**b) Creer un trigger `handle_reservation_property_status`** sur la table `reservations` :
- A l'insertion ou mise a jour d'une reservation :
  - Si `statut` est `confirmee` ou `en_cours` et que `property_id` est renseigne : mettre le bien en `reserve`
  - Si `statut` est `terminee` ou `annulee` : verifier s'il n'y a pas d'autre reservation active sur ce bien, et si non, remettre le bien en `disponible`

**c) Mettre a jour `auto_complete_reservations`** pour aussi remettre le bien en `disponible` quand la reservation passe a `terminee`.

### 2. `src/hooks/useDashboardData.tsx` : ajouter `sejours_en_cours` a l'interface
- Ajouter le champ `sejours_en_cours` dans l'interface `SimpleDashboardData`

### 3. `src/components/dashboard/SimpleDailyActivity.tsx` : afficher "Sejours en cours"
- Remplacer "Taches urgentes" par "Sejours en cours" (ou ajouter un 5e element) dans la grille d'activite quotidienne
- Utiliser une icone appropriee (ex: `Clock` ou `Building`)

### 4. `src/components/dialogs/ReservationDialog.tsx` : pas de changement
- Le trigger SQL gerera automatiquement la mise a jour du statut du bien

### Ce qui ne change PAS
- La structure de la page Biens (elle lit deja le statut depuis la table `properties`)
- Le formulaire de reservation
- Les RLS policies
- Le graphique financier

## Details techniques

### Trigger SQL
```text
FUNCTION handle_reservation_property_status()
  AFTER INSERT OR UPDATE ON reservations
  FOR EACH ROW
  
  Si NEW.property_id IS NOT NULL:
    Si NEW.statut IN ('confirmee', 'en_cours'):
      UPDATE properties SET statut = 'reserve' WHERE id = NEW.property_id
    Si NEW.statut IN ('terminee', 'annulee'):
      -- Verifier qu'aucune autre reservation active n'existe pour ce bien
      Si pas d'autre reservation active:
        UPDATE properties SET statut = 'disponible' WHERE id = NEW.property_id
```

### Vue mise a jour
```text
v_dashboard_simple ajout :
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS sejours_en_cours FROM reservations
  WHERE entreprise_id = e.id AND statut IN ('en_cours', 'confirmee')
    AND date_arrivee <= CURRENT_DATE AND date_depart >= CURRENT_DATE
) sc ON true
```

