import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEntreprise } from "@/hooks/useEntreprise";

/**
 * Compteur de messages non lus.
 * `enabled = false` (formule sans messagerie) : ni requête ni abonnement realtime.
 */
export const useUnreadMessages = (enabled = true) => {
  const { user } = useAuth();
  const { entrepriseId } = useEntreprise();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchCount = useCallback(async () => {
    if (!enabled || !user) return;
    const { count, error } = await supabase
      .from("direct_messages")
      .select("id", { count: "exact", head: true })
      .eq("receiver_id", user.id)
      .eq("read", false);

    if (!error && count !== null) {
      setUnreadCount(count);
    }
  }, [enabled, user]);

  useEffect(() => {
    if (!enabled) {
      setUnreadCount(0);
      return;
    }
    fetchCount();
  }, [enabled, fetchCount]);

  useEffect(() => {
    if (!enabled || !user || !entrepriseId) return;

    const channel = supabase
      .channel("unread-messages-count")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "direct_messages", filter: `entreprise_id=eq.${entrepriseId}` },
        () => {
          fetchCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, user, entrepriseId, fetchCount]);

  return { unreadCount };
};
