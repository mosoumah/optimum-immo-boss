import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  Users,
  FileText,
  Receipt,
  TrendingDown,
  CheckSquare,
  Sparkles,
  Plus,
  BarChart3,
  CalendarCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useEntreprise } from "@/hooks/useEntreprise";

import { useAgencySettings } from "@/hooks/useAgencySettings";
import { useDashboardData } from "@/hooks/useDashboardData";
import { supabase } from "@/integrations/supabase/client";
import { ClientDialog } from "@/components/dialogs/ClientDialog";
import { DevisDialog } from "@/components/dialogs/DevisDialog";
import { FactureDialog } from "@/components/dialogs/FactureDialog";
import { DepenseDialog } from "@/components/dialogs/DepenseDialog";
import { TacheDialog } from "@/components/dialogs/TacheDialog";
import { DocumentDialog } from "@/components/dialogs/DocumentDialog";
import { ReservationDialog } from "@/components/dialogs/ReservationDialog";
import { FloatingParticles } from "@/components/FloatingParticles";
import { DynamicSidebar } from "@/components/DynamicSidebar";
import { NotificationBell } from "@/components/NotificationBell";

// Dashboard components
import { SimpleFinanceSummary } from "@/components/dashboard/SimpleFinanceSummary";
import { SimpleDailyActivity } from "@/components/dashboard/SimpleDailyActivity";
import { SimpleChart } from "@/components/dashboard/SimpleChart";

interface Profile {
  nom: string;
  entreprise_id: string | null;
}

interface Client {
  id: string;
  nom: string;
  email: string | null;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { isAdmin, isAgent, loading: roleLoading } = useUserRole();
  const { entrepriseId, isLoading: entrepriseLoading } = useEntreprise();
  const { locationEnabled } = useAgencySettings();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch dashboard data from views
  const dashboardData = useDashboardData(entrepriseId, "simple", false);

  // Dialog states
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [devisDialogOpen, setDevisDialogOpen] = useState(false);
  const [factureDialogOpen, setFactureDialogOpen] = useState(false);
  const [depenseDialogOpen, setDepenseDialogOpen] = useState(false);
  const [tacheDialogOpen, setTacheDialogOpen] = useState(false);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [reservationDialogOpen, setReservationDialogOpen] = useState(false);

  const fetchProfileAndClients = async () => {
    if (!user) return;

    const { data: profileData } = await supabase
      .from("profiles")
      .select("nom, entreprise_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileData) {
      setProfile({ nom: profileData.nom, entreprise_id: profileData.entreprise_id });

      if (profileData.entreprise_id) {
        const { data: clientsData } = await supabase
          .from("clients")
          .select("id, nom, email")
          .eq("entreprise_id", profileData.entreprise_id)
          .order("created_at", { ascending: false })
          .limit(3);

        setClients(clientsData || []);
      }
    }
    setIsLoading(false);
  };

  // Auto-complete expired reservations
  useEffect(() => {
    if (entrepriseId) {
      supabase.rpc("auto_complete_reservations", { _entreprise_id: entrepriseId });
    }
  }, [entrepriseId]);

  useEffect(() => {
    if (!roleLoading && user) {
      fetchProfileAndClients().catch((err) => {
        console.error("Dashboard data fetch error:", err);
        setIsLoading(false);
      });
    } else if (!user && !roleLoading) {
      setIsLoading(false);
    }
  }, [user, roleLoading]);


  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // Build quick actions based on role
  const getQuickActions = () => {
    const actions = [
      { label: "Nouveau devis", icon: FileText, onClick: () => setDevisDialogOpen(true) },
      { label: "Nouvelle facture", icon: Receipt, onClick: () => setFactureDialogOpen(true) },
      { label: "Document IA", icon: Sparkles, onClick: () => setDocumentDialogOpen(true) },
    ];

    if (locationEnabled) {
      actions.unshift({ label: "Nouvelle réservation", icon: CalendarCheck, onClick: () => setReservationDialogOpen(true) });
    }

    if (isAdmin) {
      return [
        { label: "Nouveau client", icon: Users, onClick: () => setClientDialogOpen(true) },
        ...actions,
        { label: "Nouvelle dépense", icon: TrendingDown, onClick: () => setDepenseDialogOpen(true) },
        { label: "Nouvelle tâche", icon: CheckSquare, onClick: () => setTacheDialogOpen(true) },
      ];
    }

    return actions;
  };

  if (isLoading || roleLoading || entrepriseLoading) {
    return (
      <div className="h-screen flex items-center justify-center mesh-gradient overflow-hidden">
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

  const quickActions = getQuickActions();

  return (
    <div className="h-screen flex relative overflow-hidden">
      <FloatingParticles count={35} />
      <DynamicSidebar onSignOut={handleSignOut} />

      <main className="flex-1 lg:ml-64 mesh-gradient h-screen flex flex-col overflow-hidden">
        <div className="p-2 lg:p-4 flex-1 min-h-0 flex flex-col overflow-hidden">
          {/* Header Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mb-1 flex-shrink-0"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg lg:text-2xl font-extrabold mb-0.5 tracking-tight">
                  Bonjour, <span className="text-gradient">{profile?.nom?.split(" ")[0] || "Utilisateur"}</span> 👋
                </h1>
                <p className="text-muted-foreground text-xs">Voici un aperçu de votre activité aujourd'hui</p>
              </div>
              <div className="flex items-center gap-2 lg:gap-4">
                <NotificationBell />
                <div className="flex flex-col items-end gap-0.5">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center transition-all duration-300 hover:scale-105 hover:border-primary/50 glow-primary-sm">
                    <span className="text-xs font-bold text-primary">
                      {profile?.nom?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "U"}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gradient-to-r from-primary/15 to-accent/15 text-primary/80 ring-1 ring-primary/10">
                    {isAdmin ? "Admin" : isAgent ? "Agent" : "Client"}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick Actions Section */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.4, delay: 0.1 }} 
            className="flex flex-wrap gap-1.5 mb-1 flex-shrink-0"
          >
            {quickActions.map((action, index) => (
              <motion.div
                key={action.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, delay: 0.15 + index * 0.03 }}
              >
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={action.onClick}
                  className="action-button bg-primary/5 border-border/40 hover:bg-primary/10 hover:border-primary/50 rounded-lg h-8 px-3 text-xs font-medium shadow-sm hover:shadow-md transition-all duration-500"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5 text-primary" />
                  {action.label}
                </Button>
              </motion.div>
            ))}
          </motion.div>

          {/* Separator */}
          <div className="flex-shrink-0 h-px w-full my-1 separator-glow" />

          {/* Dashboard Content */}
          <div className="flex flex-col gap-1 flex-1 min-h-0">
            {/* Ligne 1 - Résumé financier */}
            <div>
              {dashboardData.simple && <SimpleFinanceSummary data={dashboardData.simple} />}
            </div>

            {/* Separator */}
            <div className="h-px w-full separator-glow flex-shrink-0" />

            {/* Ligne 2 - Activité du jour */}
            <div>
              {dashboardData.simple && <SimpleDailyActivity data={dashboardData.simple} />}
            </div>

            {/* Separator */}
            <div className="h-px w-full separator-glow flex-shrink-0" />

            {/* Ligne 3 - Graphique + Clients */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-1.5 lg:gap-2 flex-1 min-h-0" style={{ gridTemplateRows: '1fr' }}>
              {entrepriseId && (
                <div className="lg:col-span-2 min-h-0 h-full">
                  <SimpleChart entrepriseId={entrepriseId} />
                </div>
              )}

              <motion.div 
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }} 
                transition={{ duration: 0.5, delay: 0.4 }} 
                className="p-2 lg:p-3 rounded-2xl card-premium flex flex-col min-h-0 h-full overflow-hidden"
              >
                <div className="flex items-center justify-between mb-3 flex-shrink-0">
                  <h2 className="section-title-premium flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    Clients récents
                  </h2>
                  {isAdmin && (
                    <Button variant="ghost" size="icon" onClick={() => setClientDialogOpen(true)} className="hover:bg-primary/10 hover:text-primary transition-colors duration-300 rounded-xl h-9 w-9">
                      <Plus className="w-5 h-5" />
                    </Button>
                  )}
                </div>
                <div className="space-y-0 flex-1">
                  {clients.length > 0 ? (
                    clients.map((client, index) => (
                      <motion.div 
                        key={client.id} 
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.5 + index * 0.05 }}
                        className={`flex items-center gap-3 p-2.5 rounded-xl bg-secondary/20 hover:bg-secondary/40 border border-transparent hover:border-border/30 transition-all duration-300 cursor-pointer group ${index > 0 ? "mt-0.5 border-t border-t-transparent" : ""}`}
                        style={index > 0 ? { borderTopColor: "transparent", backgroundImage: undefined } : undefined}
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors flex-shrink-0 ring-1 ring-primary/10">
                          <Users className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm truncate">{client.nom}</div>
                          <div className="text-xs text-muted-foreground truncate">{client.email || "Pas d'email"}</div>
                        </div>
                        <Link to={`/clients/${client.id}`} className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs hover:bg-primary/10 hover:text-primary rounded-lg">
                            Voir
                          </Button>
                        </Link>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="text-xs">Aucun client</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      {/* Dialogs */}
      {profile?.entreprise_id && (
        <>
          <ClientDialog
            open={clientDialogOpen}
            onOpenChange={setClientDialogOpen}
            entrepriseId={profile.entreprise_id}
            onSuccess={fetchProfileAndClients}
          />
          <DevisDialog
            open={devisDialogOpen}
            onOpenChange={setDevisDialogOpen}
            entrepriseId={profile.entreprise_id}
            onSuccess={fetchProfileAndClients}
          />
          <FactureDialog
            open={factureDialogOpen}
            onOpenChange={setFactureDialogOpen}
            entrepriseId={profile.entreprise_id}
            onSuccess={fetchProfileAndClients}
          />
          <DepenseDialog
            open={depenseDialogOpen}
            onOpenChange={setDepenseDialogOpen}
            entrepriseId={profile.entreprise_id}
            onSuccess={fetchProfileAndClients}
          />
          <TacheDialog
            open={tacheDialogOpen}
            onOpenChange={setTacheDialogOpen}
            entrepriseId={profile.entreprise_id}
            onSuccess={fetchProfileAndClients}
          />
          <DocumentDialog
            open={documentDialogOpen}
            onOpenChange={setDocumentDialogOpen}
            entrepriseId={profile.entreprise_id}
            onSuccess={fetchProfileAndClients}
          />
          <ReservationDialog
            open={reservationDialogOpen}
            onOpenChange={setReservationDialogOpen}
            reservation={null}
            onSuccess={fetchProfileAndClients}
          />
        </>
      )}
    </div>
  );
};

export default Dashboard;
