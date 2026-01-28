import { useState, useRef, useEffect } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Send, Loader2, Check, Clock, User, ClipboardList } from "lucide-react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTacheMessages } from "@/hooks/useTacheMessages";
import { useEntreprise } from "@/hooks/useEntreprise";
import { supabase } from "@/integrations/supabase/client";
import { QuickTaskDialog } from "./QuickTaskDialog";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UserWithRole {
  id: string;
  nom: string;
  email: string;
  role: AppRole | null;
}

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
  const [userSelectorOpen, setUserSelectorOpen] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [quickTaskOpen, setQuickTaskOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, isLoading, isSending, sendMessage, currentUserId } =
    useTacheMessages(tache?.id || null);
  const { entrepriseId } = useEntreprise();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  // Fetch users when popover opens
  useEffect(() => {
    const fetchUsers = async () => {
      if (!userSelectorOpen || !entrepriseId) return;
      
      setUsersLoading(true);
      try {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, nom, email")
          .eq("entreprise_id", entrepriseId);

        if (!profiles) {
          setUsers([]);
          return;
        }

        const usersWithRoles: UserWithRole[] = [];
        for (const profile of profiles) {
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", profile.id)
            .maybeSingle();

          usersWithRoles.push({
            ...profile,
            role: roleData?.role || null,
          });
        }
        setUsers(usersWithRoles);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setUsersLoading(false);
      }
    };

    fetchUsers();
  }, [userSelectorOpen, entrepriseId]);

  const filteredUsers = users.filter((user) => {
    if (roleFilter === "all") return true;
    return user.role === roleFilter;
  });

  const handleSelectUser = (user: UserWithRole) => {
    setSelectedUser(user);
    setUserSelectorOpen(false);
    setQuickTaskOpen(true);
  };

  const getRoleBadgeColor = (role: AppRole | null) => {
    switch (role) {
      case "admin":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "agent":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "client":
        return "bg-primary/20 text-primary border-primary/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

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
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col bg-[hsl(220,20%,6%)] border-primary/20">
        {/* Premium header */}
        <DialogHeader className="pb-4 border-b border-primary/20 bg-gradient-to-r from-primary/15 via-primary/5 to-transparent -mx-6 -mt-6 px-6 pt-6 rounded-t-lg">
          <div className="flex items-start justify-between gap-2">
            <DialogTitle className="text-lg font-semibold text-foreground flex-1">
              {tache.titre}
            </DialogTitle>
            
            {/* Bouton Assigner tâche avec sélecteur */}
            <Popover open={userSelectorOpen} onOpenChange={setUserSelectorOpen}>
              <PopoverTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary shrink-0"
                >
                  <ClipboardList className="w-4 h-4" />
                  <span className="hidden sm:inline">Assigner tâche</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-72 p-0 bg-[hsl(220,20%,8%)] border-primary/20" 
                align="end"
              >
                <div className="p-3 border-b border-primary/20">
                  <h4 className="font-medium text-sm text-foreground">Sélectionner un destinataire</h4>
                </div>
                
                {/* Filtres par rôle */}
                <div className="flex gap-1 p-2 border-b border-primary/10">
                  {["all", "admin", "agent", "client"].map((role) => (
                    <Button
                      key={role}
                      size="sm"
                      variant={roleFilter === role ? "default" : "ghost"}
                      className={cn(
                        "h-7 text-xs px-2",
                        roleFilter === role 
                          ? "bg-primary text-primary-foreground" 
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      onClick={() => setRoleFilter(role)}
                    >
                      {role === "all" ? "Tous" : role.charAt(0).toUpperCase() + role.slice(1)}
                    </Button>
                  ))}
                </div>
                
                {/* Liste des utilisateurs */}
                <ScrollArea className="max-h-[200px]">
                  {usersLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="w-5 h-5 animate-spin text-primary/50" />
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      Aucun utilisateur trouvé
                    </div>
                  ) : (
                    <div className="p-1">
                      {filteredUsers.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => handleSelectUser(user)}
                          className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-primary/10 transition-colors text-left"
                        >
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                              {user.nom.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {user.nom}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {user.email}
                            </p>
                          </div>
                          {user.role && (
                            <Badge 
                              variant="outline" 
                              className={cn("text-xs shrink-0", getRoleBadgeColor(user.role))}
                            >
                              {user.role}
                            </Badge>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-2">
            <Badge
              variant={tache.statut === "fait" ? "default" : "secondary"}
              className={cn(
                "gap-1",
                tache.statut === "fait" 
                  ? "bg-primary/20 text-primary border border-primary/30" 
                  : "bg-muted/50 text-muted-foreground"
              )}
            >
              {tache.statut === "fait" ? (
                <Check className="w-3 h-3" />
              ) : (
                <Clock className="w-3 h-3" />
              )}
              {tache.statut === "fait" ? "Fait" : "À faire"}
            </Badge>
            <span className="text-primary/50">•</span>
            <span>{format(new Date(tache.date), "d MMMM yyyy", { locale: fr })}</span>
            {tache.assignee_name && (
              <>
                <span className="text-primary/50">•</span>
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

        {/* Messages area with dark theme */}
        <ScrollArea className="flex-1 min-h-[200px] max-h-[300px] pr-4 bg-black/20 -mx-6 px-6 py-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary/50" />
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
                    <Avatar className="w-8 h-8 shrink-0 ring-1 ring-primary/20">
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
                          "rounded-2xl px-4 py-2",
                          isOwn
                            ? "bg-gradient-to-br from-primary to-primary/70 text-primary-foreground rounded-br-md shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
                            : "bg-[hsl(220,15%,15%)] text-foreground rounded-bl-md border border-primary/10"
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

        {/* Input area with green accent */}
        <div className="flex gap-2 pt-4 border-t border-primary/20 -mx-6 px-6 -mb-6 pb-6 bg-black/30">
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
      </DialogContent>
      
      {/* QuickTaskDialog pour créer la tâche */}
      {selectedUser && entrepriseId && (
        <QuickTaskDialog
          open={quickTaskOpen}
          onOpenChange={setQuickTaskOpen}
          assigneeId={selectedUser.id}
          assigneeName={selectedUser.nom}
          entrepriseId={entrepriseId}
          onSuccess={() => {
            setQuickTaskOpen(false);
            setSelectedUser(null);
          }}
        />
      )}
    </Dialog>
  );
};
