import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  Users,
  FileText,
  Receipt,
  TrendingDown,
  CheckSquare,
  
  Plus,
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

import { FactureDialog } from "@/components/dialogs/FactureDialog";
import { DepenseDialog } from "@/components/dialogs/DepenseDialog";
import { TacheDialog } from "@/components/dialogs/TacheDialog";

import { ReservationDialog } from "@/components/dialogs/ReservationDialog";
import { FloatingParticles } from "@/components/FloatingParticles";
import { DynamicSidebar } from "@/components/DynamicSidebar";
import { NotificationBell } from "@/components/NotificationBell";
import { MessageBell } from "@/components/MessageBell";
import { AIChatBot } from "@/components/chat/AIChatBot";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useIsMobile } from "@/hooks/use-mobile";

// Dashboard components
import { SimpleFinanceSummary } from "@/components/dashboard/SimpleFinanceSummary";
import { SimpleDailyActivity } from "@/components/dashboard/SimpleDailyActivity";
import { SimpleChart } from "@/components/dashboard/SimpleChart";
import { QuickActionsFab } from "@/components/dashboard/QuickActionsFab";

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
  const { isAdmin, isAgent: _isAgent, loading: roleLoading } = useUserRole();
  const { entrepriseId, isLoading: entrepriseLoading } = useEntreprise();
  const { locationEnabled } = useAgencySettings();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch dashboard data from views
  const dashboardData = useDashboardData(entrepriseId, "simple", false);

  // Dialog states
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  
  const [factureDialogOpen, setFactureDialogOpen] = useState(false);
  const [depenseDialogOpen, setDepenseDialogOpen] = useState(false);
  const [tacheDialogOpen, setTacheDialogOpen] = useState(false);
  
  const [reservationDialogOpen, setReservationDialogOpen] = useState(false);

  const fetchProfileAndClients = useCallback(async () => {
    if (!user) return;

    const { data: ctx } = await supabase.rpc("get_current_user_context");
    const ctxObj = ctx as Record<string, unknown> | null;
    const profileData = ctxObj ? { nom: ctxObj.nom as string, entreprise_id: ctxObj.entreprise_id as string | null } : null;

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
  }, [user]);

  // Auto-complete expired reservations
  useEffect(() => {
    if (entrepriseId) {
      supabase.rpc("auto_complete_reservations", { _entreprise_id: entrepriseId });
    }
  }, [entrepriseId]);

  useEffect(() => {
    if (roleLoading) return;
    if (user) {
      fetchProfileAndClients().catch((err) => {
        console.error("Dashboard data fetch error:", err);
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, [user, roleLoading, fetchProfileAndClients]);


  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // Build quick actions based on role
  const getQuickActions = () => {
    const actions = [
      { label: "Nouvelle facture", icon: Receipt, onClick: () => setFactureDialogOpen(true) },
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
    <div className="min-h-screen lg:h-screen flex relative lg:overflow-hidden">
      {!isMobile && <FloatingParticles count={18} />}
      <DynamicSidebar onSignOut={handleSignOut} />

      <main className="flex-1 lg:ml-64 mesh-gradient min-h-screen lg:h-screen flex flex-col lg:overflow-hidden">
        {/* Mobile sticky header */}
        <div className="sm:hidden sticky top-0 z-30 backdrop-blur-xl bg-background/75 border-b border-border/40 px-4 py-3 pl-16 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-extrabold tracking-tight truncate">
              Bonjour, <span className="text-gradient">{profile?.nom?.split(" ")[0] || "Utilisateur"}</span> 👋
            </h1>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <MessageBell />
            <NotificationBell />
          </div>
        </div>

        <div className="px-4 py-4 sm:p-2 lg:p-4 flex-1 min-h-0 flex flex-col lg:overflow-hidden gap-4 sm:gap-0 pb-28 sm:pb-2">
          {/* Desktop Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="hidden sm:block mb-1 flex-shrink-0"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg lg:text-2xl font-extrabold mb-0.5 tracking-tight">
                  Bonjour, <span className="text-gradient">{profile?.nom?.split(" ")[0] || "Utilisateur"}</span> 👋
                </h1>
                <p className="text-muted-foreground text-xs">Voici un aperçu de votre activité aujourd'hui</p>
              </div>
              <div className="flex items-center gap-2 lg:gap-4">
                <MessageBell />
                <NotificationBell />
              </div>
            </div>
          </motion.div>

          {/* Quick Actions Section - desktop only */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="hidden sm:flex flex-wrap gap-1.5 mb-1 flex-shrink-0"
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
          <div className="hidden sm:block flex-shrink-0 h-px w-full my-1 separator-glow" />

          {/* Dashboard Content */}
          <div className="flex flex-col gap-4 sm:gap-1 flex-1 min-h-0">
            {/* Ligne 1 - Résumé financier */}
            <div>
              {dashboardData.simple && <SimpleFinanceSummary data={dashboardData.simple} />}
            </div>

            <div className="hidden sm:block h-px w-full separator-glow flex-shrink-0" />

            {/* Ligne 2 - Activité du jour */}
            <div>
              {dashboardData.simple && <SimpleDailyActivity data={dashboardData.simple} />}
            </div>

            <div className="hidden sm:block h-px w-full separator-glow flex-shrink-0" />

            {/* Ligne 3 - Graphique + Clients */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-1.5 lg:gap-2 flex-1 min-h-0 lg:[grid-template-rows:1fr]">
              {entrepriseId && (
                <div className="lg:col-span-2 min-h-[520px] sm:min-h-[420px] lg:min-h-0 h-full">
                  <SimpleChart entrepriseId={entrepriseId} />
                </div>

              )}

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="p-4 sm:p-2 lg:p-3 rounded-2xl card-premium flex flex-col min-h-0 h-full overflow-hidden"
              >
                <div className="flex items-center justify-between mb-3 flex-shrink-0">
                  <h2 className="section-title-premium flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    Clients récents
                  </h2>
                  {isAdmin && (
                    <Button variant="ghost" size="icon" onClick={() => setClientDialogOpen(true)} className="hover:bg-primary/10 hover:text-primary transition-colors duration-300 rounded-xl h-11 w-11 sm:h-9 sm:w-9">
                      <Plus className="w-5 h-5" />
                    </Button>
                  )}
                </div>
                <div className="flex flex-col gap-2 sm:gap-0.5 flex-1">
                  {clients.length > 0 ? (
                    clients.map((client, index) => (
                      <motion.div
                        key={client.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
                        className="flex items-center gap-3 p-3 sm:p-2.5 rounded-xl bg-secondary/30 sm:bg-secondary/20 border border-border/20 sm:border-transparent transition-all duration-300 group"
                      >
                        <div className="w-10 h-10 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 ring-1 ring-primary/15">
                          <Users className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm truncate">{client.nom}</div>
                          <div className="text-xs text-muted-foreground truncate">{client.email || "Pas d'email"}</div>
                        </div>
                        <Link to={`/clients/${client.id}`} className="flex-shrink-0">
                          <Button variant="ghost" size="sm" className="h-9 sm:h-7 px-3 sm:px-2 text-xs hover:bg-primary/10 hover:text-primary rounded-lg">
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

      {/* Mobile FAB quick actions */}
      <QuickActionsFab actions={quickActions} />

      {/* AI Chatbot */}
      <ErrorBoundary name="AIChatBot">
        <AIChatBot userName={profile?.nom || undefined} />
      </ErrorBoundary>

      {/* Dialogs */}
      {profile?.entreprise_id && (
        <>
          <ClientDialog
            open={clientDialogOpen}
            onOpenChange={setClientDialogOpen}
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
