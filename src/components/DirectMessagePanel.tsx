import { useState, useRef, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Send, Loader2, X, Users, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useDirectMessages } from "@/hooks/useDirectMessages";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface DirectMessagePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const roleColors: Record<AppRole, string> = {
  admin: "bg-violet-500/20 text-violet-700 border-violet-300",
  agent: "bg-blue-500/20 text-blue-700 border-blue-300",
  client: "bg-emerald-500/20 text-emerald-700 border-emerald-300",
};

const roleAvatarColors: Record<AppRole, string> = {
  admin: "bg-violet-500 text-white",
  agent: "bg-blue-500 text-white",
  client: "bg-emerald-500 text-white",
};

const roleLabels: Record<AppRole, string> = {
  admin: "Admin",
  agent: "Agent",
  client: "Client",
};

export const DirectMessagePanel = ({
  open,
  onOpenChange,
}: DirectMessagePanelProps) => {
  const [newMessage, setNewMessage] = useState("");
  const [roleFilter, setRoleFilter] = useState<AppRole | "all">("all");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    users,
    messages,
    isLoadingUsers,
    isLoadingMessages,
    isSending,
    selectedUserId,
    setSelectedUserId,
    sendMessage,
    currentUserId,
  } = useDirectMessages();

  const filteredUsers = users.filter(
    (u) => roleFilter === "all" || u.role === roleFilter
  );

  const selectedUser = users.find((u) => u.id === selectedUserId);

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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col">
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Messagerie
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* User list */}
          <div className="w-1/3 border-r border-border flex flex-col">
            {/* Role filter */}
            <div className="p-2 border-b border-border">
              <div className="flex flex-wrap gap-1">
                <Button
                  variant={roleFilter === "all" ? "default" : "ghost"}
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => setRoleFilter("all")}
                >
                  Tous
                </Button>
                {(["admin", "agent", "client"] as AppRole[]).map((role) => (
                  <Button
                    key={role}
                    variant={roleFilter === role ? "default" : "ghost"}
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setRoleFilter(role)}
                  >
                    {roleLabels[role]}
                  </Button>
                ))}
              </div>
            </div>

            {/* User list */}
            <ScrollArea className="flex-1">
              {isLoadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8 px-2">
                  <Users className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Aucun utilisateur
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => setSelectedUserId(u.id)}
                      className={cn(
                        "w-full p-3 text-left hover:bg-muted/50 transition-colors",
                        selectedUserId === u.id && "bg-muted"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback
                            className={cn(
                              "text-xs",
                              u.role && roleAvatarColors[u.role]
                            )}
                          >
                            {getInitials(u.nom)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{u.nom}</p>
                          {u.role && (
                            <Badge
                              variant="outline"
                              className={cn("text-xs mt-0.5", roleColors[u.role])}
                            >
                              {roleLabels[u.role]}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Conversation area */}
          <div className="flex-1 flex flex-col">
            {!selectedUserId ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Sélectionnez un utilisateur</p>
                  <p className="text-sm">pour démarrer une conversation</p>
                </div>
              </div>
            ) : (
              <>
                {/* Conversation header */}
                <div className="p-3 border-b border-border flex items-center gap-2">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback
                      className={cn(
                        "text-xs",
                        selectedUser?.role && roleAvatarColors[selectedUser.role]
                      )}
                    >
                      {selectedUser && getInitials(selectedUser.nom)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{selectedUser?.nom}</p>
                    {selectedUser?.role && (
                      <Badge
                        variant="outline"
                        className={cn("text-xs", roleColors[selectedUser.role])}
                      >
                        {roleLabels[selectedUser.role]}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  {isLoadingMessages ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">Aucun message</p>
                      <p className="text-xs mt-1">
                        Envoyez un message pour démarrer la conversation
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((msg) => {
                        const isOwn = msg.sender_id === currentUserId;
                        return (
                          <div
                            key={msg.id}
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
                                    : selectedUser?.role &&
                                        roleAvatarColors[selectedUser.role]
                                )}
                              >
                                {getInitials(msg.sender_name || "?")}
                              </AvatarFallback>
                            </Avatar>
                            <div
                              className={cn(
                                "flex flex-col max-w-[70%]",
                                isOwn ? "items-end" : "items-start"
                              )}
                            >
                              <div
                                className={cn(
                                  "rounded-2xl px-4 py-2 shadow-sm",
                                  isOwn
                                    ? "bg-primary text-primary-foreground rounded-br-md"
                                    : "bg-muted rounded-bl-md"
                                )}
                              >
                                <p className="text-sm whitespace-pre-wrap break-words">
                                  {msg.message}
                                </p>
                              </div>
                              <span className="text-xs text-muted-foreground mt-1 px-1">
                                {formatDistanceToNow(new Date(msg.created_at), {
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

                {/* Input */}
                <div className="p-3 border-t border-border">
                  <div className="flex gap-2">
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
                </div>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
