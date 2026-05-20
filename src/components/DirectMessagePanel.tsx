import { useState, useRef, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Send, Loader2, Users, MessageCircle, ClipboardList } from "lucide-react";
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
import { useEntreprise } from "@/hooks/useEntreprise";
import { QuickTaskDialog } from "@/components/dialogs/QuickTaskDialog";
import { PermissionGate } from "@/components/PermissionGate";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface DirectMessagePanelProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  isEmbedded?: boolean;
  onClose?: () => void;
}

const roleColors: Record<AppRole, string> = {
  admin: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  agent: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  client: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
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
  isEmbedded = false,
  _onClose,
}: DirectMessagePanelProps) => {
  const [newMessage, setNewMessage] = useState("");
  const [roleFilter, setRoleFilter] = useState<AppRole | "all">("all");
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { entrepriseId } = useEntreprise();

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

  const panelContent = (
    <>
      {/* Premium header */}
      <div className="p-4 border-b border-primary/20 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent">
        <div className="flex items-center gap-2 text-foreground font-semibold">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shadow-[0_0_15px_hsl(var(--primary)/0.3)]">
            <MessageCircle className="w-4 h-4 text-primary" />
          </div>
          Messagerie
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* User list - dark theme */}
        <div className="w-1/3 border-r border-primary/10 flex flex-col bg-black/40">
          {/* Role filter */}
          <div className="p-2 border-b border-primary/10">
            <div className="flex flex-wrap gap-1">
              <Button
                variant={roleFilter === "all" ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "text-xs h-7",
                  roleFilter === "all" 
                    ? "bg-primary text-primary-foreground shadow-[0_0_10px_hsl(var(--primary)/0.4)]" 
                    : "text-muted-foreground hover:text-foreground hover:bg-primary/10"
                )}
                onClick={() => setRoleFilter("all")}
              >
                Tous
              </Button>
              {(["admin", "agent", "client"] as AppRole[]).map((role) => (
                <Button
                  key={role}
                  variant={roleFilter === role ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "text-xs h-7",
                    roleFilter === role 
                      ? "bg-primary text-primary-foreground shadow-[0_0_10px_hsl(var(--primary)/0.4)]" 
                      : "text-muted-foreground hover:text-foreground hover:bg-primary/10"
                  )}
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
                <Loader2 className="w-5 h-5 animate-spin text-primary/50" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 px-2">
                <Users className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">
                  Aucun utilisateur
                </p>
              </div>
            ) : (
              <div className="divide-y divide-primary/5">
                {filteredUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => setSelectedUserId(u.id)}
                    className={cn(
                      "w-full p-3 text-left transition-all duration-200",
                      selectedUserId === u.id 
                        ? "bg-gradient-to-r from-primary/20 to-transparent border-l-2 border-primary" 
                        : "hover:bg-primary/5 border-l-2 border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8 ring-2 ring-primary/20">
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
                        <p className="text-sm font-medium truncate text-foreground">{u.nom}</p>
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
        <div className="flex-1 flex flex-col bg-black/20">
          {!selectedUserId ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <MessageCircle className="w-8 h-8 text-primary/50" />
                </div>
                <p className="text-foreground/80">Sélectionnez un utilisateur</p>
                <p className="text-sm text-muted-foreground">pour démarrer une conversation</p>
              </div>
            </div>
          ) : (
            <>
              {/* Conversation header with task button */}
              <div className="p-3 border-b border-primary/20 bg-gradient-to-r from-primary/15 via-primary/5 to-transparent flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="w-10 h-10 ring-2 ring-primary/30 shadow-[0_0_15px_hsl(var(--primary)/0.2)]">
                    <AvatarFallback
                      className={cn(
                        "text-sm",
                        selectedUser?.role && roleAvatarColors[selectedUser.role]
                      )}
                    >
                      {selectedUser && getInitials(selectedUser.nom)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm text-foreground">{selectedUser?.nom}</p>
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
                
                {/* Assign task button */}
                <Button
                  size="sm"
                  variant="outline"
                  className="border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary shadow-[0_0_10px_hsl(var(--primary)/0.2)] hover:shadow-[0_0_15px_hsl(var(--primary)/0.3)] transition-all"
                  onClick={() => setShowTaskDialog(true)}
                >
                  <ClipboardList className="w-4 h-4 mr-1.5" />
                  Assigner tâche
                </Button>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-primary/50" />
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
                          <Avatar className="w-8 h-8 shrink-0 ring-1 ring-primary/20">
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
                                "rounded-2xl px-4 py-2",
                                isOwn
                                  ? "bg-gradient-to-br from-primary to-primary/70 text-primary-foreground rounded-br-md shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
                                  : "bg-[hsl(220,15%,15%)] text-foreground rounded-bl-md border border-primary/10"
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

              {/* Input with green accent */}
              <PermissionGate permission="envoyer_message" fallback={
                <div className="p-3 border-t border-primary/20 bg-black/30 text-center">
                  <p className="text-sm text-muted-foreground">Vous n'avez pas la permission d'envoyer des messages.</p>
                </div>
              }>
                <div className="p-3 border-t border-primary/20 bg-black/30">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Écrire un message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={isSending}
                      className="flex-1 bg-[hsl(220,15%,12%)] border-primary/20 focus:border-primary focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
                    />
                    <Button
                      size="icon"
                      onClick={handleSend}
                      disabled={isSending || !newMessage.trim()}
                      className="bg-primary hover:bg-primary/90 shadow-[0_0_15px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_20px_hsl(var(--primary)/0.5)] transition-all"
                    >
                      {isSending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </PermissionGate>
            </>
          )}
        </div>
      </div>
    </>
  );

  if (isEmbedded) {
    return (
      <>
        <div className="flex flex-col h-full">
          {panelContent}
        </div>
        {selectedUser && entrepriseId && (
          <QuickTaskDialog
            open={showTaskDialog}
            onOpenChange={setShowTaskDialog}
            assigneeId={selectedUser.id}
            assigneeName={selectedUser.nom}
            entrepriseId={entrepriseId}
            onSuccess={() => {}}
          />
        )}
      </>
    );
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent 
          side="right" 
          className="w-full sm:max-w-2xl p-0 flex flex-col bg-[hsl(220,20%,6%)] border-l border-primary/20"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Messagerie</SheetTitle>
          </SheetHeader>
          {panelContent}
        </SheetContent>
      </Sheet>

      {/* Quick Task Dialog */}
      {selectedUser && entrepriseId && (
        <QuickTaskDialog
          open={showTaskDialog}
          onOpenChange={setShowTaskDialog}
          assigneeId={selectedUser.id}
          assigneeName={selectedUser.nom}
          entrepriseId={entrepriseId}
          onSuccess={() => {}}
        />
      )}
    </>
  );
};
