import { useState, useRef, useEffect } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Send, Loader2, Check, Clock, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTacheMessages } from "@/hooks/useTacheMessages";
import { cn } from "@/lib/utils";

interface TacheWithAssignee {
  id: string;
  titre: string;
  description: string | null;
  statut: string;
  date: string;
  assigned_to: string | null;
  assignee_name?: string;
}

interface TacheDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tache: TacheWithAssignee | null;
}

export const TacheDetailDialog = ({
  open,
  onOpenChange,
  tache,
}: TacheDetailDialogProps) => {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, isLoading, isSending, sendMessage, currentUserId } =
    useTacheMessages(tache?.id || null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    
    const success = await sendMessage(newMessage);
    if (success) {
      setNewMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!tache) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader className="pb-4 border-b border-border">
          <DialogTitle className="text-lg font-semibold">
            {tache.titre}
          </DialogTitle>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-2">
            <Badge
              variant={tache.statut === "fait" ? "default" : "secondary"}
              className="gap-1"
            >
              {tache.statut === "fait" ? (
                <Check className="w-3 h-3" />
              ) : (
                <Clock className="w-3 h-3" />
              )}
              {tache.statut === "fait" ? "Fait" : "À faire"}
            </Badge>
            <span>•</span>
            <span>{format(new Date(tache.date), "d MMMM yyyy", { locale: fr })}</span>
            {tache.assignee_name && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {tache.assignee_name}
                </span>
              </>
            )}
          </div>
          {tache.description && (
            <p className="text-sm text-muted-foreground mt-2">
              {tache.description}
            </p>
          )}
        </DialogHeader>

        {/* Messages area */}
        <ScrollArea className="flex-1 min-h-[200px] max-h-[300px] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-muted-foreground text-sm">
                Aucun message pour le moment
              </p>
              <p className="text-muted-foreground text-xs mt-1">
                Envoyez un message pour démarrer la conversation
              </p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {messages.map((message) => {
                const isOwn = message.user_id === currentUserId;
                const initials = (message.sender_name || "?")
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);
                
                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-2",
                      isOwn ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarFallback
                        className={cn(
                          "text-xs",
                          isOwn
                            ? "bg-primary text-primary-foreground"
                            : "bg-blue-500 text-white"
                        )}
                      >
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={cn(
                        "flex flex-col max-w-[75%]",
                        isOwn ? "items-end" : "items-start"
                      )}
                    >
                      {!isOwn && (
                        <span className="text-xs font-medium text-muted-foreground mb-1 px-1">
                          {message.sender_name}
                        </span>
                      )}
                      <div
                        className={cn(
                          "rounded-2xl px-4 py-2 shadow-sm",
                          isOwn
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-muted rounded-bl-md"
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.message}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground mt-1 px-1">
                        {formatDistanceToNow(new Date(message.created_at), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input area */}
        <div className="flex gap-2 pt-4 border-t border-border">
          <Input
            placeholder="Écrire un message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSending}
            className="flex-1"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={isSending || !newMessage.trim()}
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
