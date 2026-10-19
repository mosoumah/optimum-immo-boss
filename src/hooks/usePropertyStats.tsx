import { useMemo } from "react";
import type { Database } from "@/integrations/supabase/types";
import { diffDaysGN, toDateOnly, todayGN } from "@/lib/dateGuinee";

type Reservation = Database["public"]["Tables"]["reservations"]["Row"];
type Property = Database["public"]["Tables"]["properties"]["Row"];

// Écart en jours calendaires guinéens (les colonnes de dates sont des DATE).
const dayDiff = (a: string | Date, b: string | Date) => {
  const from = toDateOnly(a);
  const to = toDateOnly(b);
  if (!from || !to) return 0;
  return Math.max(0, diffDaysGN(from, to));
};

export const usePropertyStats = (property: Property | null, reservations: Reservation[]) => {
  return useMemo(() => {
    const total = reservations.length;
    const revenue = reservations.reduce((s, r) => s + Number(r.montant_total || 0), 0);
    // Jours occupés : séjours confirmés, en cours ou terminés (jamais en
    // attente, jamais annulés).
    const occupiedDays = reservations
      .filter((r) => r.statut === "en_cours" || r.statut === "terminee" || r.statut === "confirmee")
      .reduce((s, r) => s + dayDiff(r.date_arrivee, r.date_depart), 0);

    const totalDays = property?.created_at
      ? Math.max(1, dayDiff(property.created_at, todayGN()))
      : 1;
    const occupancyRate = Math.min(100, Math.round((occupiedDays / totalDays) * 100));

    const last = [...reservations].sort(
      (a, b) => new Date(b.date_arrivee).getTime() - new Date(a.date_arrivee).getTime()
    )[0];

    return {
      total,
      revenue,
      occupancyRate,
      occupiedDays,
      lastReservation: last ?? null,
    };
  }, [property, reservations]);
};
