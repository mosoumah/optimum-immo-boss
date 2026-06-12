import { useMemo } from "react";
import type { Database } from "@/integrations/supabase/types";

type Reservation = Database["public"]["Tables"]["reservations"]["Row"];
type Property = Database["public"]["Tables"]["properties"]["Row"];

const dayDiff = (a: string | Date, b: string | Date) => {
  const d1 = new Date(a);
  const d2 = new Date(b);
  return Math.max(0, Math.ceil((d2.getTime() - d1.getTime()) / 86400000));
};

export const usePropertyStats = (property: Property | null, reservations: Reservation[]) => {
  return useMemo(() => {
    const total = reservations.length;
    const revenue = reservations.reduce((s, r) => s + Number(r.montant_total || 0), 0);
    const occupiedDays = reservations
      .filter((r) => r.statut === "en_cours" || r.statut === "terminee")
      .reduce((s, r) => s + dayDiff(r.date_arrivee, r.date_depart), 0);

    const totalDays = property?.created_at
      ? Math.max(1, dayDiff(property.created_at, new Date()))
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
