import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface TacheMessage {
  id: string;
  tache_id: string;
  user_id: string;
  message: string;
  created_at: string;
  sender_name?: string;
}

export const useTacheMessages = (tacheId: string | null) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<TacheMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!tacheId) {
      setMessages([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    // Fetch messages
    const { data: messagesData, error } = await supabase
      .from("tache_messages")
      .select("id, tache_id, user_id, message, created_at")
      .eq("tache_id", tacheId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      setMessages([]);
      setIsLoading(false);
      return;
    }

    if (!messagesData || messagesData.length === 0) {
      setMessages([]);
      setIsLoading(false);
      return;
    }

    // Fetch profiles for all unique user_ids
    const userIds = [...new Set(messagesData.map((m) => m.user_id))];
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, nom")
      .in("id", userIds);

    const profilesMap = new Map(
      (profilesData || []).map((p) => [p.id, p.nom])
    );

    const messagesWithNames = messagesData.map((msg) => ({
      id: msg.id,
      tache_id: msg.tache_id,
      user_id: msg.user_id,
      message: msg.message,
      created_at: msg.created_at,
      sender_name: profilesMap.get(msg.user_id) || "Utilisateur",
    }));
    
    setMessages(messagesWithNames);
    setIsLoading(false);
  }, [tacheId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Realtime subscription
  useEffect(() => {
    if (!tacheId) return;

    const channel = supabase
      .channel(`tache-${tacheId}-messages`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "tache_messages",
          filter: `tache_id=eq.${tacheId}`,
        },
        async (payload) => {
          // Fetch the sender name for the new message
          const { data: profile } = await supabase
            .from("profiles")
            .select("nom")
            .eq("id", payload.new.user_id)
            .single();

          const newMessage: TacheMessage = {
            id: payload.new.id,
            tache_id: payload.new.tache_id,
            user_id: payload.new.user_id,
            message: payload.new.message,
            created_at: payload.new.created_at,
            sender_name: profile?.nom || "Utilisateur",
          };

          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tacheId]);

  const sendMessage = async (messageText: string) => {
    if (!tacheId || !user || !messageText.trim()) return false;

    setIsSending(true);

    const { error } = await supabase.from("tache_messages").insert({
      tache_id: tacheId,
      user_id: user.id,
      message: messageText.trim(),
    });

    setIsSending(false);

    if (error) {
      console.error("Error sending message:", error);
      return false;
    }

    return true;
  };

  return {
    messages,
    isLoading,
    isSending,
    sendMessage,
    currentUserId: user?.id,
  };
};
