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
  Search,
  BarChart3,
  LayoutDashboard,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useEntreprise } from "@/hooks/useEntreprise";
import { useSubscription } from "@/hooks/useSubscription";
import { useDashboardData } from "@/hooks/useDashboardData";
import { supabase } from "@/integrations/supabase/client";
import { ClientDialog } from "@/components/dialogs/ClientDialog";
import { DevisDialog } from "@/components/dialogs/DevisDialog";
import { FactureDialog } from "@/components/dialogs/FactureDialog";
import { DepenseDialog } from "@/components/dialogs/DepenseDialog";
import { TacheDialog } from "@/components/dialogs/TacheDialog";
import { DocumentDialog } from "@/components/dialogs/DocumentDialog";
import { FloatingParticles } from "@/components/FloatingParticles";
import { DynamicSidebar } from "@/components/DynamicSidebar";
import { NotificationBell } from "@/components/NotificationBell";

// Dashboard components
import { SimpleFinanceSummary } from "@/components/dashboard/SimpleFinanceSummary";
import { SimpleDailyActivity } from "@/components/dashboard/SimpleDailyActivity";
import { SimpleChart } from "@/components/dashboard/SimpleChart";
import { AdvancedTopProperties } from "@/components/dashboard/AdvancedTopProperties";
import { AdvancedAlerts } from "@/components/dashboard/AdvancedAlerts";
import { AdvancedAISummary } from "@/components/dashboard/AdvancedAISummary";
import { PremiumUpgradeCard } from "@/components/dashboard/PremiumUpgradeCard";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Building2, AlertTriangle, Brain } from "lucide-react";

interface Profile {
  nom: string;
  entreprise_id: string | null;
}

interface Client {
  id: string;
  nom: string;
  email: string | null;
}

type DashboardMode = "simple" | "advanced";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { isAdmin, isAgent, loading: roleLoading } = useUserRole();
  const { entrepriseId, isLoading: entrepriseLoading } = useEntreprise();
  const { isPremium, isLoading: subLoading } = useSubscription();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dashboard mode with localStorage persistence
  const [dashboardMode, setDashboardMode] = useState<DashboardMode>(() => {
    const saved = localStorage.getItem("dashboard-mode");
    return (saved === "advanced" ? "advanced" : "simple") as DashboardMode;
  });

  const handleModeChange = (mode: DashboardMode) => {
    setDashboardMode(mode);
    localStorage.setItem("dashboard-mode", mode);
  };

  // Fetch dashboard data from views
  const dashboardData = useDashboardData(entrepriseId, dashboardMode, isPremium);

  // Dialog states
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [devisDialogOpen, setDevisDialogOpen] = useState(false);
  const [factureDialogOpen, setFactureDialogOpen] = useState(false);
  const [depenseDialogOpen, setDepenseDialogOpen] = useState(false);
  const [tacheDialogOpen, setTacheDialogOpen] = useState(false);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);

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

  if (isLoading || roleLoading || entrepriseLoading || subLoading) {
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
        <header className="flex-shrink-0 z-40 header-gradient backdrop-blur-xl border-b border-border/30">
          <div className="flex items-center justify-between px-4 lg:px-6 py-3">
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative w-40 lg:w-64 ml-12 lg:ml-0"
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Rechercher..." 
                className="pl-9 h-9 bg-secondary/30 border-border/30 rounded-xl focus:border-primary/50 focus:ring-primary/20 transition-all duration-300 text-sm" 
              />
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-2 lg:gap-4"
            >
              <NotificationBell />
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center transition-all duration-300 hover:scale-105 hover:border-primary/50">
                <span className="text-xs font-bold text-primary">
                  {profile?.nom?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "U"}
                </span>
              </div>
            </motion.div>
          </div>
        </header>

        <div className="p-2 lg:p-4 flex-1 min-h-0 flex flex-col overflow-y-auto">
          {/* Header Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mb-2 flex-shrink-0"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg lg:text-2xl font-extrabold mb-0.5 tracking-tight">
                  Bonjour, <span className="text-gradient">{profile?.nom?.split(" ")[0] || "Utilisateur"}</span> 👋
                </h1>
                <p className="text-muted-foreground text-xs">Voici un aperçu de votre activité aujourd'hui</p>
              </div>
              {/* Mode Toggle */}
              {isAdmin && (
                <div className="flex items-center gap-1 bg-secondary/30 rounded-lg p-1">
                  <Button
                    variant={dashboardMode === "simple" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleModeChange("simple")}
                    className={`rounded-md h-8 px-3 text-xs ${
                      dashboardMode === "simple"
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-secondary/50"
                    }`}
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 mr-1.5" />
                    Simple
                  </Button>
                  <Button
                    variant={dashboardMode === "advanced" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleModeChange("advanced")}
                    className={`rounded-md h-8 px-3 text-xs ${
                      dashboardMode === "advanced"
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-secondary/50"
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 mr-1.5" />
                    Avancé
                  </Button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Quick Actions Section */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.4, delay: 0.1 }} 
            className="flex flex-wrap gap-1.5 mb-2 flex-shrink-0"
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
                  className="action-button border-border/40 hover:border-primary/50 rounded-lg h-8 px-3 text-xs font-medium shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5 text-primary" />
                  {action.label}
                </Button>
              </motion.div>
            ))}
          </motion.div>

          {/* Separator */}
          <div className="flex-shrink-0 h-px w-full my-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

          {/* Dashboard Content */}
          {dashboardMode === "simple" ? (
            <div className="space-y-3 flex-1 min-h-0">
              {/* Ligne 1 - Résumé financier */}
              {dashboardData.simple && <SimpleFinanceSummary data={dashboardData.simple} />}

              {/* Separator */}
              <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

              {/* Ligne 2 - Activité du jour */}
              {dashboardData.simple && <SimpleDailyActivity data={dashboardData.simple} />}

              {/* Separator */}
              <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

              {/* Ligne 3 - Graphique + Ligne 4 - Clients */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 lg:gap-3">
                {entrepriseId && (
                  <div className="lg:col-span-2">
                    <SimpleChart entrepriseId={entrepriseId} />
                  </div>
                )}

                <motion.div 
                  initial={{ opacity: 0, x: 20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ duration: 0.5, delay: 0.4 }} 
                  className="p-2 lg:p-3 rounded-2xl card-premium flex flex-col"
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
                  <div className="space-y-2 flex-1">
                    {clients.length > 0 ? (
                      clients.map((client, index) => (
                        <motion.div 
                          key={client.id} 
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.5 + index * 0.05 }}
                          className="flex items-center gap-3 p-2.5 rounded-xl bg-secondary/20 hover:bg-secondary/40 border border-transparent hover:border-border/30 transition-all duration-300 cursor-pointer group"
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
          ) : dashboardMode === "advanced" && (isAdmin || isPremium) ? (
            <div className="space-y-3 flex-1 min-h-0">
              {/* Section Simple - Résumé financier */}
              {dashboardData.simple && <SimpleFinanceSummary data={dashboardData.simple} />}

              <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

              {/* Section Simple - Activité du jour */}
              {dashboardData.simple && <SimpleDailyActivity data={dashboardData.simple} />}

              <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

              {/* Section Simple - Graphique + Accordéon compact */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 lg:gap-3">
                {entrepriseId && (
                  <div className="lg:col-span-2">
                    <SimpleChart entrepriseId={entrepriseId} />
                  </div>
                )}

                <div className="p-2 lg:p-3 rounded-2xl card-premium">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="top-properties" className="border-border/30">
                      <AccordionTrigger className="py-2.5 text-sm font-semibold hover:no-underline">
                        <span className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-primary" />
                          Top 3 biens du mois
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <AdvancedTopProperties data={dashboardData.topProperties} />
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="alerts" className="border-border/30">
                      <AccordionTrigger className="py-2.5 text-sm font-semibold hover:no-underline">
                        <span className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-destructive" />
                          Alertes intelligentes
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <AdvancedAlerts data={dashboardData.alerts} />
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="ai-summary" className="border-b-0">
                      <AccordionTrigger className="py-2.5 text-sm font-semibold hover:no-underline">
                        <span className="flex items-center gap-2">
                          <Brain className="w-4 h-4 text-primary" />
                          Résumé IA du mois
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        {entrepriseId && <AdvancedAISummary entrepriseId={entrepriseId} />}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </div>
            </div>
          ) : (
            <PremiumUpgradeCard />
          )}
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
        </>
      )}
    </div>
  );
};

export default Dashboard;
