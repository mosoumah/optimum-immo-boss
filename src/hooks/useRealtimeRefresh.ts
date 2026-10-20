import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Tables suivies par le rafraîchissement temps réel. */
export type RealtimeTable = "revenus" | "reservations" | "factures" | "depenses" | "properties";

/** Regroupe les rafales d'événements (un paiement touche réservation + revenu + facture). */
const DEBOUNCE_MS = 400;

/**
 * Rafraîchit un écran quand les données de l'entreprise changent.
 *
 * - un seul canal Supabase Realtime par instance de composant (nom unique),
 *   supprimé au démontage : aucun abonnement en double ;
 * - filtre `entreprise_id` pour ne recevoir que les données de l'agence ;
 * - anti-rebond de 400 ms, car un même paiement déclenche plusieurs événements
 *   (réservation, revenu créé par le serveur, facture passée en « payé ») ;
 * - `onChange` est lu via une ref : la fonction peut changer à chaque rendu
 *   sans réabonner le canal.
 */
export const useRealtimeRefresh = (
  entrepriseId: string | null | undefined,
  tables: RealtimeTable[],
  onChange: () => void,
) => {
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Identifiant stable de l'instance : évite deux canaux de même nom quand
  // plusieurs composants écoutent les mêmes tables.
  const channelIdRef = useRef(`rt_${Math.random().toString(36).slice(2, 10)}`);
  const timerRef = useRef<number | null>(null);
  const tablesKey = tables.join(",");

  useEffect(() => {
    if (!entrepriseId || !tablesKey) return;

    const channel = supabase.channel(`${channelIdRef.current}:${entrepriseId}`);

    for (const table of tablesKey.split(",") as RealtimeTable[]) {
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          filter: `entreprise_id=eq.${entrepriseId}`,
        },
        () => {
          if (timerRef.current !== null) window.clearTimeout(timerRef.current);
          timerRef.current = window.setTimeout(() => {
            timerRef.current = null;
            onChangeRef.current();
          }, DEBOUNCE_MS);
        },
      );
    }

    channel.subscribe();

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      supabase.removeChannel(channel);
    };
  }, [entrepriseId, tablesKey]);
};
