/**
 * Vocabulaire des statuts de réservation, partagé par les vues analytiques.
 *
 * Règle : une réservation occupe le bien sauf si elle est annulée. Les séjours
 * terminés comptent donc toujours — sinon, tous les jours passés retombent à
 * 0 % dans les graphiques d'occupation.
 */

export const CANCELLED_STATUTS = new Set(["annulee", "annulée", "annule", "annulé"]);

/** La réservation est-elle annulée ? */
export const isReservationCancelled = (statut: string | null | undefined): boolean =>
  CANCELLED_STATUTS.has(String(statut ?? "").trim().toLowerCase());

/** Vrai si la réservation n'est pas annulée : elle occupe alors le bien. */
export const isOccupying = (statut: string | null | undefined): boolean =>
  !isReservationCancelled(statut);
