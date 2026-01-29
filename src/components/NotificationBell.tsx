import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, CheckCheck, Trash2, Clock, Send, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useNotifications } from "@/hooks/useNotifications";
import { useDirectMessages } from "@/hooks/useDirectMessages";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

export const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const { sendMessage, setSelectedUserId } = useDirectMessages();

  const selectedNotification = notifications.find((n) => n.id === selectedNotificationId);

  const formatTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: fr,
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "tache":
        return "📋";
      case "message":
        return "💬";
      case "devis":
        return "📄";
      case "facture":
        return "💰";
      default:
        return "🔔";
    }
  };

  const handleSelectNotification = (notificationId: string) => {
    setSelectedNotificationId(notificationId);
    const notification = notifications.find((n) => n.id === notificationId);
    if (notification && !notification.lue) {
      markAsRead(notificationId);
    }
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedNotification?.reference_id) return;

    setIsSendingReply(true);
    try {
      // Set the receiver as the reference_id (user who triggered the notification)
      setSelectedUserId(selectedNotification.reference_id);
      const success = await sendMessage(replyMessage);
      if (success) {
        setReplyMessage("");
      }
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedNotificationId]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-primary/10 transition-colors duration-300 rounded-lg h-9 w-9"
        >
          <Bell className="w-4 h-4" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-primary text-primary-foreground text-[10px] font-bold rounded-full px-1 shadow-[0_0_10px_hsl(var(--primary)/0.5)]"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl p-0 flex flex-col bg-[hsl(220,20%,6%)] border-l border-primary/20"
      >
        {/* Premium header */}
        <SheetHeader className="p-4 border-b border-primary/20 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-foreground">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shadow-[0_0_15px_hsl(var(--primary)/0.3)]">
                <Bell className="w-4 h-4 text-primary" />
              </div>
              Notifications
            </SheetTitle>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="h-7 text-xs text-muted-foreground hover:text-foreground hover:bg-primary/10"
              >
                <CheckCheck className="w-3.5 h-3.5 mr-1" />
                Tout marquer lu
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Notification list - left panel */}
          <div className="w-1/3 border-r border-primary/10 flex flex-col bg-black/40">
            <ScrollArea className="flex-1">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-primary/50" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground px-2">
                  <Bell className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm text-center">Aucune notification</p>
                </div>
              ) : (
                <div className="divide-y divide-primary/5">
                  {notifications.map((notification, index) => (
                    <motion.button
                      key={notification.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => handleSelectNotification(notification.id)}
                      className={cn(
                        "w-full p-3 text-left transition-all duration-200",
                        selectedNotificationId === notification.id
                          ? "bg-gradient-to-r from-primary/20 to-transparent border-l-2 border-primary"
                          : "hover:bg-primary/5 border-l-2 border-transparent",
                        !notification.lue && "bg-primary/5"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <div
                          className={cn(
                            "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm",
                            !notification.lue
                              ? "bg-primary/20 ring-1 ring-primary/30"
                              : "bg-[hsl(220,15%,15%)]"
                          )}
                        >
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              "text-sm font-medium truncate",
                              !notification.lue ? "text-foreground" : "text-muted-foreground"
                            )}
                          >
                            {notification.titre}
                          </p>
                          <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground/70">
                            <Clock className="w-2.5 h-2.5" />
                            {formatTime(notification.created_at)}
                          </div>
                        </div>
                        {!notification.lue && (
                          <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.6)]" />
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Conversation / Details area - right panel */}
          <div className="flex-1 flex flex-col bg-black/20">
            {!selectedNotificationId ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <MessageCircle className="w-8 h-8 text-primary/50" />
                  </div>
                  <p className="text-foreground/80">Sélectionnez une notification</p>
                  <p className="text-sm text-muted-foreground">pour voir les détails</p>
                </div>
              </div>
            ) : selectedNotification ? (
              <>
                {/* Notification detail header */}
                <div className="p-4 border-b border-primary/20 bg-gradient-to-r from-primary/15 via-primary/5 to-transparent">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-lg shadow-[0_0_15px_hsl(var(--primary)/0.2)]">
                      {getNotificationIcon(selectedNotification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">
                        {selectedNotification.titre}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(selectedNotification.created_at)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        deleteNotification(selectedNotification.id);
                        setSelectedNotificationId(null);
                      }}
                      className="h-8 w-8 rounded-md hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Message content */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {/* Main notification message */}
                    <div className="flex gap-3">
                      <Avatar className="w-10 h-10 ring-2 ring-primary/20">
                        <AvatarFallback className="bg-primary/20 text-primary text-sm">
                          {getNotificationIcon(selectedNotification.type)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="bg-[hsl(220,15%,12%)] rounded-2xl rounded-tl-md px-4 py-3 border border-primary/10">
                          <p className="font-medium text-sm text-foreground mb-1">
                            {selectedNotification.titre}
                          </p>
                          {selectedNotification.message && (
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {selectedNotification.message}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground mt-1 px-1">
                          {formatTime(selectedNotification.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2">
                      {!selectedNotification.lue && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markAsRead(selectedNotification.id)}
                          className="border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary text-xs"
                        >
                          <Check className="w-3.5 h-3.5 mr-1" />
                          Marquer comme lu
                        </Button>
                      )}
                    </div>
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Reply input */}
                {selectedNotification.reference_id && (
                  <div className="p-3 border-t border-primary/20 bg-black/30">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Répondre..."
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isSendingReply}
                        className="flex-1 bg-[hsl(220,15%,12%)] border-primary/20 focus:border-primary focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
                      />
                      <Button
                        size="icon"
                        onClick={handleSendReply}
                        disabled={isSendingReply || !replyMessage.trim()}
                        className="bg-primary hover:bg-primary/90 shadow-[0_0_15px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_20px_hsl(var(--primary)/0.5)] transition-all"
                      >
                        {isSendingReply ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
