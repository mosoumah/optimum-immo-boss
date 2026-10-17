import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

/**
 * Colonnes horaires de `public.reservations`.
 *
 * `heure_debut` / `heure_fin` existent en base mais sont absentes de
 * `src/integrations/supabase/types.ts` (fichier auto-généré, non modifié).
 * On isole donc ici les types et les accès en lecture et en écriture, comme
 * pour `plans`, `subscription_payments` et `activity_log`.
 *
 * Contrainte serveur : si l'une des deux est renseignée, l'autre doit l'être
 * aussi, et `heure_fin` doit être strictement postérieure à `heure_debut`.
 */

type ReservationRow = Database["public"]["Tables"]["reservations"]["Row"];
type ReservationInsert = Database["public"]["Tables"]["reservations"]["Insert"];
type ReservationUpdate = Database["public"]["Tables"]["reservations"]["Update"];

export interface ReservationTimes {
  /** "HH:MM:SS" en lecture ; "HH:MM" accepté en écriture. null si non renseigné. */
  heure_debut: string | null;
  heure_fin: string | null;
}

export type ReservationRowWithTimes = ReservationRow & ReservationTimes;
export type ReservationInsertWithTimes = ReservationInsert & ReservationTimes;
export type ReservationUpdateWithTimes = ReservationUpdate & ReservationTimes;

/**
 * Lit les heures d'une réservation déjà chargée.
 * `select("*")` ramène bien les colonnes, même si le type généré les ignore.
 */
export const reservationTimes = (
  row: ReservationRow | ReservationRowWithTimes | null | undefined,
): ReservationTimes => {
  const source = row as unknown as Partial<ReservationTimes> | null | undefined;
  return {
    heure_debut: source?.heure_debut ?? null,
    heure_fin: source?.heure_fin ?? null,
  };
};

/** Tronque "HH:MM:SS" en "HH:MM" pour les champs <input type="time">. */
export const toTimeInput = (value: string | null | undefined): string =>
  typeof value === "string" && value.length >= 5 ? value.slice(0, 5) : "";

/** Convertit "HH:MM" en minutes depuis minuit. null si invalide. */
export const timeToMinutes = (value: string | null | undefined): number | null => {
  if (typeof value !== "string" || !/^\d{2}:\d{2}$/.test(value)) return null;
  const [hours, minutes] = value.split(":").map(Number);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
};

/**
 * Durée exacte en heures décimales entre deux "HH:MM".
 * Ex. 14:30 -> 15:45 = 1.25. Renvoie 0 si l'intervalle est invalide
 * (heure de fin antérieure ou égale, ou format incorrect).
 */
export const timeDurationHours = (
  debut: string | null | undefined,
  fin: string | null | undefined,
): number => {
  const start = timeToMinutes(debut);
  const end = timeToMinutes(fin);
  if (start === null || end === null || end <= start) return 0;
  return (end - start) / 60;
};

/** Durée lisible : "1 h 15", "2 h", "45 min". */
export const formatDuration = (hours: number): string => {
  if (!hours || hours <= 0) return "0 min";
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, "0")}`;
};

// Écriture : insert et update élargis avec les deux colonnes.
type WriteResult = PromiseLike<{
  data: { id: string } | null;
  error: { message: string } | null;
}>;

type ReservationTimesTable = {
  insert: (payload: ReservationInsertWithTimes) => {
    select: (columns: string) => {
      single: () => WriteResult;
    };
  };
  update: (payload: ReservationUpdateWithTimes) => {
    eq: (column: string, value: unknown) => WriteResult;
  };
};

/** public.reservations — insert/update incluant heure_debut et heure_fin. */
export function reservationsTimesTable() {
  return supabase.from("reservations") as unknown as ReservationTimesTable;
}
