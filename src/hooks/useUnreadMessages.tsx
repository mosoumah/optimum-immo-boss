import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEntreprise } from "@/hooks/useEntreprise";

export const useUnreadMessages = () => {
  const { user } = useAuth();
  const { entrepriseId } = useEntreprise();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchCount = useCallback(async () => {
    if (!user) return;
    const { count, error } = await supabase
      .from("direct_messages")
      .select("id", { count: "exact", head: true })
      .eq("receiver_id", user.id)
      .eq("read", false);

    if (!error && count !== null) {
      setUnreadCount(count);
    }
  }, [user]);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  useEffect(() => {
    if (!user || !entrepriseId) return;

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
  }, [user, entrepriseId, fetchCount]);

  return { unreadCount };
};
