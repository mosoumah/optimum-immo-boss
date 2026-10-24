/**
 * Erreurs métier renvoyées par le serveur pour les réservations.
 *
 * Le serveur refuse une réservation qui chevauche une autre sur le même bien
 * avec un message préfixé : "RESERVATION_CHEVAUCHEMENT: ce bien est déjà
 * réservé du … au … (client : …). Choisissez d'autres dates ou un autre bien."
 *
 * Le préfixe est technique : il sert au client à reconnaître le cas, mais il ne
 * doit jamais être affiché à l'utilisateur.
 */

export const RESERVATION_CHEVAUCHEMENT = "RESERVATION_CHEVAUCHEMENT";

/** Le message d'erreur est-il un refus pour chevauchement de réservation ? */
export const isReservationOverlapError = (message: string | null | undefined): boolean =>
  typeof message === "string" && message.includes(RESERVATION_CHEVAUCHEMENT);

/**
 * Phrase du serveur, sans préfixe technique ni deux-points résiduels.
 * Repli lisible si le serveur n'a envoyé que le préfixe.
 */
export const reservationOverlapMessage = (message: string): string => {
  const phrase = message
    .replace(new RegExp(`${RESERVATION_CHEVAUCHEMENT}\\s*:?\\s*`, "g"), "")
    .trim();
  return phrase || "Ce bien est déjà réservé sur ces dates. Choisissez d'autres dates ou un autre bien.";
};
