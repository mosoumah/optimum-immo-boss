import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Notification {
  id: string;
  user_id: string;
  type: string;
  titre: string;
  message: string | null;
  lue: boolean;
  reference_id: string | null;
  created_at: string;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const unreadCount = notifications.filter((n) => !n.lue).length;

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Error fetching notifications:", error);
      return;
    }

    setNotifications(data || []);
    setLoading(false);
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ lue: true })
      .eq("id", notificationId);

    if (error) {
      console.error("Error marking notification as read:", error);
      return;
    }

    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, lue: true } : n))
    );
  };

  const markAllAsRead = async () => {
    if (!user) return;

    const { error } = await supabase
      .from("notifications")
      .update({ lue: true })
      .eq("user_id", user.id)
      .eq("lue", false);

    if (error) {
      console.error("Error marking all notifications as read:", error);
      return;
    }

    setNotifications((prev) => prev.map((n) => ({ ...n, lue: true })));
  };

  const deleteNotification = async (notificationId: string) => {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId);

    if (error) {
      console.error("Error deleting notification:", error);
      return;
    }

    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    fetchNotifications();

    // Subscribe to realtime notifications
    const channel = supabase
      .channel("user-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications((prev) => [newNotification, ...prev]);
          toast.info(newNotification.titre, {
            description: newNotification.message || undefined,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications]);

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch: fetchNotifications,
  };
};
