

# Fix: Invoice auto-generation from reservation form

## Problem
In `ReservationDialog.tsx` line 131, the condition `form.generer_facture && !reservation && result.data` requires `result.data` to be truthy. However, the `.select().single()` call after insert depends on the RLS SELECT policy for `reservations`, which may not return the row (e.g., for agents whose clients aren't assigned to them). When `result.data` is `null`, the invoice generation is silently skipped even though the reservation was created.

## Fix
**File**: `src/components/dialogs/ReservationDialog.tsx`

Change the condition on line 131 from:
```
if (form.generer_facture && !reservation && result.data)
```
to:
```
if (form.generer_facture && !reservation && !result.error)
```

This ensures that as long as the reservation insert didn't fail, the invoice will be generated -- regardless of whether the SELECT after insert returned data.

No other files or logic will be modified.
