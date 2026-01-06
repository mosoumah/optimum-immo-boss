import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, Plus, ArrowLeft, Eye, Pencil, Trash2 } from "lucide-react";
import { FloatingParticles } from "@/components/FloatingParticles";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useEntreprise } from "@/hooks/useEntreprise";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { PermissionGate } from "@/components/PermissionGate";
import { ClientDialog } from "@/components/dialogs/ClientDialog";
import { EditClientDialog } from "@/components/dialogs/EditClientDialog";
import { DynamicSidebar } from "@/components/DynamicSidebar";
import { toast } from "sonner";
import { checkPermission } from "@/lib/checkPermission";
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

interface Client {
  id: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  created_at: string;
}

const Clients = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { entrepriseId, isLoading: entrepriseLoading } = useEntreprise();
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const fetchClients = useCallback(async () => {
    if (!entrepriseId) return;

    // RLS will automatically filter based on role
    const { data } = await supabase
      .from("clients")
      .select("*")
      .eq("entreprise_id", entrepriseId)
      .order("created_at", { ascending: false });

    setClients(data || []);
    setIsLoading(false);
  }, [entrepriseId]);

  useEffect(() => {
    if (entrepriseId) {
      fetchClients();
    }
  }, [entrepriseId, fetchClients]);

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (client: Client) => {
    setSelectedClient(client);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedClient) return;

    // Server-side permission check
    const canDelete = await checkPermission("supprimer_client");
    if (!canDelete) {
      toast.error("Vous n'avez pas la permission de supprimer des clients");
      return;
    }

    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", selectedClient.id);

    if (error) {
      toast.error("Erreur lors de la suppression du client");
      return;
    }

    toast.success("Client supprimé avec succès");
    setDeleteDialogOpen(false);
    setSelectedClient(null);
    fetchClients();
  };

  if (entrepriseLoading || isLoading || permissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex relative">
      <FloatingParticles count={25} />
      <DynamicSidebar onSignOut={handleSignOut} />
      
      <main className="flex-1 ml-64 mesh-gradient min-h-screen p-8">
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-8 premium-header rounded-xl p-4"
          >
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Clients</h1>
              <p className="text-muted-foreground">
                {hasPermission("creer_client") ? "Gérez vos clients" : "Vos clients assignés"}
              </p>
            </div>
          </motion.div>

          <PermissionGate permission="creer_client">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex justify-end mb-6"
            >
              <Button onClick={() => setDialogOpen(true)} className="premium-button">
                <Plus className="w-4 h-4 mr-2" />
                Nouveau client
              </Button>
            </motion.div>
          </PermissionGate>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl border border-border/50 overflow-hidden premium-card"
          >
            {clients.length > 0 ? (
              <div className="divide-y divide-border/50">
                {clients.map((client, index) => (
                  <motion.div 
                    key={client.id} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 flex items-center gap-4 hover:bg-secondary/30 transition-colors premium-list-item"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{client.nom}</div>
                      <div className="text-sm text-muted-foreground">{client.email || "Pas d'email"}</div>
                    </div>
                    <div className="text-sm text-muted-foreground">{client.telephone || "-"}</div>
                    <div className="flex items-center gap-2">
                      <PermissionGate permission="modifier_client">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(client)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </PermissionGate>
                      <PermissionGate permission="supprimer_client">
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(client)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </PermissionGate>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/clients/${client.id}`}>
                          <Eye className="w-4 h-4 mr-1" />
                          Voir fiche
                        </Link>
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  {hasPermission("creer_client") ? "Aucun client pour le moment" : "Aucun client assigné"}
                </p>
              </div>
            )}
          </motion.div>
        </div>

        {entrepriseId && (
          <ClientDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            entrepriseId={entrepriseId}
            onSuccess={fetchClients}
          />
        )}

        <EditClientDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          client={selectedClient}
          onSuccess={fetchClients}
        />

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer le client ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. Le client "{selectedClient?.nom}" sera supprimé définitivement.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
};

export default Clients;
