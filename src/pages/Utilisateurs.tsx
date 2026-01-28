import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  UserPlus,
  Users,
  Shield,
  User,
  UserCheck,
  MoreVertical,
  Search,
  Bell,
  Mail,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DynamicSidebar } from "@/components/DynamicSidebar";
import { FloatingParticles } from "@/components/FloatingParticles";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UserWithRole {
  id: string;
  nom: string;
  email: string;
  role: AppRole;
  created_at: string;
}

interface Client {
  id: string;
  nom: string;
  email: string | null;
}

const Utilisateurs = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Form state for new user
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserNom, setNewUserNom] = useState("");
  const [newUserRole, setNewUserRole] = useState<AppRole>("agent");
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserWithRole | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Get current user's entreprise_id
      const { data: profileData } = await supabase
        .from("profiles")
        .select("entreprise_id")
        .eq("id", user.id)
        .maybeSingle();

      if (!profileData?.entreprise_id) return;

      // Fetch all profiles in this entreprise with their roles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, nom, email, created_at")
        .eq("entreprise_id", profileData.entreprise_id);

      if (profiles) {
        // Fetch roles for each user
        const usersWithRoles: UserWithRole[] = [];
        for (const profile of profiles) {
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", profile.id)
            .maybeSingle();

          usersWithRoles.push({
            ...profile,
            role: (roleData?.role as AppRole) || "agent",
          });
        }
        setUsers(usersWithRoles);
      }

      // Fetch clients for client account creation
      const { data: clientsData } = await supabase
        .from("clients")
        .select("id, nom, email")
        .eq("entreprise_id", profileData.entreprise_id);

      setClients(clientsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserNom) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    if (newUserRole === "client" && !selectedClientId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un client pour ce compte",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      // Get current user's entreprise_id
      const { data: profileData } = await supabase
        .from("profiles")
        .select("entreprise_id")
        .eq("id", user?.id)
        .maybeSingle();

      if (!profileData?.entreprise_id) throw new Error("Entreprise non trouvée");

      // Call the Edge Function to invite user (sends confirmation email!)
      const { data, error } = await supabase.functions.invoke("admin-create-user", {
        body: {
          email: newUserEmail,
          nom: newUserNom,
          role: newUserRole,
          entreprise_id: profileData.entreprise_id,
          client_id: newUserRole === "client" ? selectedClientId : null,
        },
      });

      if (error) {
        console.error("Edge function error:", error);
        throw new Error(error.message || "Erreur lors de la création");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Invitation envoyée",
        description: `Un email d'invitation a été envoyé à ${newUserEmail}`,
      });

      setCreateDialogOpen(false);
      setNewUserEmail("");
      setNewUserNom("");
      setNewUserRole("agent");
      setSelectedClientId("");
      fetchData();
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);

    try {
      const { data, error } = await supabase.functions.invoke("admin-delete-user", {
        body: { user_id: userToDelete.id },
      });

      if (error) {
        console.error("Edge function error:", error);
        throw new Error(error.message || "Erreur lors de la suppression");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Succès",
        description: `L'utilisateur ${userToDelete.nom} a été supprimé`,
      });

      setDeleteDialogOpen(false);
      setUserToDelete(null);
      fetchData();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteDialog = (userToRemove: UserWithRole) => {
    // Prevent deleting yourself
    if (userToRemove.id === user?.id) {
      toast({
        title: "Action impossible",
        description: "Vous ne pouvez pas vous supprimer vous-même",
        variant: "destructive",
      });
      return;
    }
    setUserToDelete(userToRemove);
    setDeleteDialogOpen(true);
  };

  const getRoleIcon = (role: AppRole) => {
    switch (role) {
      case "admin":
        return <Shield className="w-4 h-4 text-primary" />;
      case "agent":
        return <User className="w-4 h-4 text-success" />;
      case "client":
        return <UserCheck className="w-4 h-4 text-warning" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getRoleLabel = (role: AppRole) => {
    switch (role) {
      case "admin":
        return "Administrateur";
      case "agent":
        return "Agent";
      case "client":
        return "Client";
      default:
        return role;
    }
  };

  const getRoleBadgeClass = (role: AppRole) => {
    switch (role) {
      case "admin":
        return "bg-primary/10 text-primary";
      case "agent":
        return "bg-success/10 text-success";
      case "client":
        return "bg-warning/10 text-warning";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center mesh-gradient">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-12 h-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-muted-foreground text-sm">Chargement...</span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex relative">
      <FloatingParticles count={35} />
      <DynamicSidebar onSignOut={handleSignOut} />

      <main className="flex-1 ml-64 mesh-gradient min-h-screen">
        <header className="sticky top-0 z-40 header-gradient backdrop-blur-xl border-b border-border/30">
          <div className="flex items-center justify-between px-8 py-4">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative w-80"
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher un utilisateur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 bg-secondary/30 border-border/30 rounded-xl"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-4"
            >
              <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-primary/10 rounded-xl"
              >
                <Bell className="w-5 h-5" />
              </Button>
            </motion.div>
          </div>
        </header>

        <div className="p-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-between mb-8"
          >
            <div>
              <h1 className="text-3xl font-bold mb-2">Gestion des utilisateurs</h1>
              <p className="text-muted-foreground">
                Gérez les accès et les rôles de votre équipe
              </p>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <UserPlus className="w-4 h-4" />
                  Nouvel utilisateur
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Inviter un utilisateur</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Nom complet *</Label>
                    <Input
                      value={newUserNom}
                      onChange={(e) => setNewUserNom(e.target.value)}
                      placeholder="Jean Dupont"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="email@exemple.com"
                    />
                    <p className="text-xs text-muted-foreground">
                      L'utilisateur recevra un email pour définir son mot de passe
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Rôle *</Label>
                    <Select
                      value={newUserRole}
                      onValueChange={(v) => setNewUserRole(v as AppRole)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrateur</SelectItem>
                        <SelectItem value="agent">Agent</SelectItem>
                        <SelectItem value="client">Client</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {newUserRole === "client" && (
                    <div className="space-y-2">
                      <Label>Lier au client *</Label>
                      <Select
                        value={selectedClientId}
                        onValueChange={setSelectedClientId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un client" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.nom} {c.email ? `(${c.email})` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <Button
                    className="w-full"
                    onClick={handleCreateUser}
                    disabled={isCreating}
                  >
                    {isCreating ? "Envoi de l'invitation..." : "Envoyer l'invitation"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8"
          >
            <div className="card-stat p-6 rounded-2xl border border-border/30">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {users.filter((u) => u.role === "admin").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Administrateurs</p>
                </div>
              </div>
            </div>
            <div className="card-stat p-6 rounded-2xl border border-border/30">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-success/10">
                  <User className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {users.filter((u) => u.role === "agent").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Agents</p>
                </div>
              </div>
            </div>
            <div className="card-stat p-6 rounded-2xl border border-border/30">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-warning/10">
                  <UserCheck className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {users.filter((u) => u.role === "client").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Clients</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Users List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="card-gradient rounded-2xl border border-border/30 overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="text-left p-4 font-medium text-muted-foreground">
                      Utilisateur
                    </th>
                    <th className="text-left p-4 font-medium text-muted-foreground">
                      Email
                    </th>
                    <th className="text-left p-4 font-medium text-muted-foreground">
                      Rôle
                    </th>
                    <th className="text-left p-4 font-medium text-muted-foreground">
                      Date création
                    </th>
                    <th className="text-right p-4 font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u, index) => (
                    <motion.tr
                      key={u.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                      className="border-b border-border/20 hover:bg-secondary/20 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center">
                            <span className="text-sm font-bold text-primary">
                              {u.nom
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium">{u.nom}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="w-4 h-4" />
                          {u.email}
                        </div>
                      </td>
                      <td className="p-4">
                        <div
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${getRoleBadgeClass(
                            u.role
                          )}`}
                        >
                          {getRoleIcon(u.role)}
                          {getRoleLabel(u.role)}
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => openDeleteDialog(u)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'utilisateur</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer{" "}
              <span className="font-semibold">{userToDelete?.nom}</span> ?
              <br />
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Utilisateurs;
