import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEntreprise } from "@/hooks/useEntreprise";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UserWithRole {
  id: string;
  nom: string;
  email: string;
  role: AppRole | null;
}

interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  read: boolean;
  created_at: string;
  sender_name?: string;
}

export const useDirectMessages = () => {
  const { user } = useAuth();
  const { entrepriseId } = useEntreprise();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Fetch all users in the entreprise with their roles
  const fetchUsers = useCallback(async () => {
    if (!entrepriseId || !user) return;

    setIsLoadingUsers(true);
    try {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, nom, email")
        .eq("entreprise_id", entrepriseId);

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        return;
      }

      // Fetch roles for each profile
      const usersWithRoles: UserWithRole[] = [];
      for (const profile of profiles || []) {
        // Skip current user
        if (profile.id === user.id) continue;

        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", profile.id)
          .maybeSingle();

        usersWithRoles.push({
          id: profile.id,
          nom: profile.nom,
          email: profile.email,
          role: roleData?.role || null,
        });
      }

      setUsers(usersWithRoles);
    } finally {
      setIsLoadingUsers(false);
    }
  }, [entrepriseId, user]);

  // Fetch messages between current user and selected user
  const fetchMessages = useCallback(async () => {
    if (!user || !selectedUserId) {
      setMessages([]);
      return;
    }

    setIsLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from("direct_messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${selectedUserId}),and(sender_id.eq.${selectedUserId},receiver_id.eq.${user.id})`
        )
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
        return;
      }

      // Get sender names
      const senderIds = [...new Set(data?.map((m) => m.sender_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, nom")
        .in("id", senderIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p.nom]) || []);

      const messagesWithNames = (data || []).map((msg) => ({
        ...msg,
        sender_name: profileMap.get(msg.sender_id) || "Inconnu",
      }));

      setMessages(messagesWithNames);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [user, selectedUserId]);

  // Send a message
  const sendMessage = async (message: string): Promise<boolean> => {
    if (!user || !selectedUserId || !entrepriseId || !message.trim()) {
      return false;
    }

    setIsSending(true);
    try {
      const { error } = await supabase.from("direct_messages").insert({
        sender_id: user.id,
        receiver_id: selectedUserId,
        entreprise_id: entrepriseId,
        message: message.trim(),
      });

      if (error) {
        console.error("Error sending message:", error);
        return false;
      }

      return true;
    } finally {
      setIsSending(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Fetch messages when selected user changes
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Realtime subscription
  useEffect(() => {
    if (!user || !selectedUserId) return;

    const channel = supabase
      .channel(`direct-messages-${user.id}-${selectedUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
        },
        async (payload) => {
          const newMsg = payload.new as DirectMessage;
          
          // Only add if it's part of this conversation
          if (
            (newMsg.sender_id === user.id && newMsg.receiver_id === selectedUserId) ||
            (newMsg.sender_id === selectedUserId && newMsg.receiver_id === user.id)
          ) {
            // Get sender name
            const { data: profile } = await supabase
              .from("profiles")
              .select("nom")
              .eq("id", newMsg.sender_id)
              .maybeSingle();

            setMessages((prev) => [
              ...prev,
              { ...newMsg, sender_name: profile?.nom || "Inconnu" },
            ]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedUserId]);

  return {
    users,
    messages,
    isLoadingUsers,
    isLoadingMessages,
    isSending,
    selectedUserId,
    setSelectedUserId,
    sendMessage,
    currentUserId: user?.id,
  };
};
