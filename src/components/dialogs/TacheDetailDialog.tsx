import { useState, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Loader2, Check, Clock, User, ClipboardList } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useEntreprise } from "@/hooks/useEntreprise";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
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
  const [userSelectorOpen, setUserSelectorOpen] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  
  const { entrepriseId } = useEntreprise();

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

  const handleSelectUser = async (user: UserWithRole) => {
    if (!tache) return;
    
    setIsAssigning(true);
    try {
      // Mettre à jour la tâche avec le nouvel assignee
      const { error: updateError } = await supabase
        .from("taches")
        .update({ assigned_to: user.id })
        .eq("id", tache.id);

      if (updateError) throw updateError;

      // Créer une notification pour le destinataire
      await supabase.from("notifications").insert({
        user_id: user.id,
        titre: "Nouvelle tâche assignée",
        message: `Une tâche vous a été assignée: ${tache.titre}`,
        type: "tache",
      });

      toast.success(`Tâche assignée à ${user.nom}`);
      setUserSelectorOpen(false);
      onOpenChange(false);
    } catch (error) {
      console.error("Error assigning task:", error);
      toast.error("Erreur lors de l'assignation");
    } finally {
      setIsAssigning(false);
    }
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

  if (!tache) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-[hsl(220,20%,6%)] border-primary/20">
        <DialogHeader className="pb-4 border-b border-primary/20 bg-gradient-to-r from-primary/15 via-primary/5 to-transparent -mx-6 -mt-6 px-6 pt-6 rounded-t-lg">
          <DialogTitle className="text-lg font-semibold text-foreground">
            {tache.titre}
          </DialogTitle>
          
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
            <p className="text-sm text-muted-foreground mt-3">
              {tache.description}
            </p>
          )}
          
          {/* Bouton Assigner tâche */}
          <div className="pt-4">
            <Popover open={userSelectorOpen} onOpenChange={setUserSelectorOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  disabled={isAssigning}
                  className="gap-2 border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary shadow-[0_0_15px_hsl(var(--primary)/0.15)] hover:shadow-[0_0_20px_hsl(var(--primary)/0.25)] transition-all"
                >
                  {isAssigning ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ClipboardList className="w-4 h-4" />
                  )}
                  Assigner tâche
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-72 p-0 bg-[hsl(220,20%,8%)] border-primary/20" 
                align="start"
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
                          disabled={isAssigning}
                          className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-primary/10 transition-colors text-left disabled:opacity-50"
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
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};
