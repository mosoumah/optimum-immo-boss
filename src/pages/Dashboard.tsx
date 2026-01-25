import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  Users,
  FileText,
  Receipt,
  TrendingUp,
  TrendingDown,
  CheckSquare,
  Sparkles,
  Plus,
  Bell,
  Search,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { ClientDialog } from "@/components/dialogs/ClientDialog";
import { DevisDialog } from "@/components/dialogs/DevisDialog";
import { FactureDialog } from "@/components/dialogs/FactureDialog";
import { DepenseDialog } from "@/components/dialogs/DepenseDialog";
import { TacheDialog } from "@/components/dialogs/TacheDialog";
import { DocumentDialog } from "@/components/dialogs/DocumentDialog";
import { FloatingParticles } from "@/components/FloatingParticles";
import { FinancialChart } from "@/components/FinancialChart";
import { DynamicSidebar } from "@/components/DynamicSidebar";

interface DashboardStats {
  revenus: number;
  depenses: number;
  facturesNonPayees: number;
}

interface Profile {
  nom: string;
  entreprise_id: string | null;
}

interface Tache {
  id: string;
  titre: string;
  statut: string;
}

interface Client {
  id: string;
  nom: string;
  email: string | null;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { isAdmin, isAgent } = useUserRole();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<DashboardStats>({ revenus: 0, depenses: 0, facturesNonPayees: 0 });
  const [taches, setTaches] = useState<Tache[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog states
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [devisDialogOpen, setDevisDialogOpen] = useState(false);
  const [factureDialogOpen, setFactureDialogOpen] = useState(false);
  const [depenseDialogOpen, setDepenseDialogOpen] = useState(false);
  const [tacheDialogOpen, setTacheDialogOpen] = useState(false);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);

  const fetchDashboardData = async () => {
    if (!user) return;

    const { data: profileData } = await supabase
      .from("profiles")
      .select("nom, entreprise_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileData) {
      setProfile({ nom: profileData.nom, entreprise_id: profileData.entreprise_id });

      const entrepriseId = profileData.entreprise_id;

      if (entrepriseId) {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        // Only fetch revenus/depenses for admin
        if (isAdmin) {
          const { data: revenusData } = await supabase
            .from("revenus")
            .select("montant")
            .eq("entreprise_id", entrepriseId)
            .gte("date", startOfMonth.toISOString().split("T")[0]);

          const totalRevenus = revenusData?.reduce((sum, r) => sum + Number(r.montant), 0) || 0;

          const { data: depensesData } = await supabase
            .from("depenses")
            .select("montant")
            .eq("entreprise_id", entrepriseId)
            .gte("date", startOfMonth.toISOString().split("T")[0]);

          const totalDepenses = depensesData?.reduce((sum, d) => sum + Number(d.montant), 0) || 0;

          const { count: unpaidCount } = await supabase
            .from("factures")
            .select("*", { count: "exact", head: true })
            .eq("entreprise_id", entrepriseId)
            .eq("statut", "non_paye");

          setStats({
            revenus: totalRevenus,
            depenses: totalDepenses,
            facturesNonPayees: unpaidCount || 0,
          });
        }

        // Fetch taches - RLS will filter based on role
        const today = new Date().toISOString().split("T")[0];
        const { data: tachesData } = await supabase
          .from("taches")
          .select("id, titre, statut")
          .eq("entreprise_id", entrepriseId)
          .eq("date", today)
          .eq("statut", "a_faire")
          .limit(5);

        setTaches(tachesData || []);

        // Fetch clients - RLS will filter based on role
        const { data: clientsData } = await supabase
          .from("clients")
          .select("id, nom, email")
          .eq("entreprise_id", entrepriseId)
          .order("created_at", { ascending: false })
          .limit(3);

        setClients(clientsData || []);
      }
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user, isAdmin]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const markTaskDone = async (taskId: string) => {
    await supabase.from("taches").update({ statut: "fait" }).eq("id", taskId);
    setTaches(taches.filter(t => t.id !== taskId));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-GN", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + " GNF";
  };

  // Build stats display based on role
  const getStatsDisplay = () => {
    if (isAdmin) {
      return [
        { label: "Revenus du mois", value: formatCurrency(stats.revenus), positive: true, icon: TrendingUp },
        { label: "Dépenses du mois", value: formatCurrency(stats.depenses), positive: false, icon: TrendingDown },
        { label: "Bénéfice estimé", value: formatCurrency(stats.revenus - stats.depenses), positive: stats.revenus > stats.depenses, icon: TrendingUp },
        { label: "Factures non payées", value: String(stats.facturesNonPayees), positive: stats.facturesNonPayees === 0, icon: Receipt },
      ];
    }
    // Agent sees limited stats
    return [
      { label: "Tâches du jour", value: String(taches.length), positive: true, icon: CheckSquare },
      { label: "Clients assignés", value: String(clients.length), positive: true, icon: Users },
    ];
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

  const statsDisplay = getStatsDisplay();
  const quickActions = getQuickActions();

  return (
    <div className="h-screen flex relative overflow-hidden">
      <FloatingParticles count={35} />
      <DynamicSidebar onSignOut={handleSignOut} />

      <main className="flex-1 ml-64 mesh-gradient h-screen flex flex-col overflow-hidden">
        <header className="flex-shrink-0 z-40 header-gradient backdrop-blur-xl border-b border-border/30">
          <div className="flex items-center justify-between px-6 py-3">
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative w-64"
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
              className="flex items-center gap-4"
            >
              <Button variant="ghost" size="icon" className="relative hover:bg-primary/10 transition-colors duration-300 rounded-lg h-9 w-9">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
              </Button>
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center transition-all duration-300 hover:scale-105 hover:border-primary/50">
                <span className="text-xs font-bold text-primary">
                  {profile?.nom?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "U"}
                </span>
              </div>
            </motion.div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden p-5 lg:p-8 flex flex-col">
          {/* Header Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mb-6 flex-shrink-0"
          >
            <h1 className="text-2xl lg:text-4xl font-extrabold mb-2 tracking-tight">
              Bonjour, <span className="text-gradient">{profile?.nom?.split(" ")[0] || "Utilisateur"}</span> 👋
            </h1>
            <p className="text-muted-foreground text-sm lg:text-base">Voici un aperçu de votre activité aujourd'hui</p>
          </motion.div>

          {/* Quick Actions Section */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.4, delay: 0.1 }} 
            className="flex flex-wrap gap-2.5 mb-6 flex-shrink-0"
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
                  className="action-button border-border/40 hover:border-primary/50 rounded-xl h-9 px-4 text-sm font-medium shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <Plus className="w-4 h-4 mr-2 text-primary" />
                  {action.label}
                </Button>
              </motion.div>
            ))}
          </motion.div>

          {/* Premium Separator */}
          <div className="section-separator mb-6 flex-shrink-0" />

          {/* KPI Cards Section */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ duration: 0.5, delay: 0.2 }} 
            className={`grid grid-cols-2 ${isAdmin ? 'lg:grid-cols-4' : 'lg:grid-cols-2'} gap-4 lg:gap-5 mb-6 flex-shrink-0`}
          >
            {statsDisplay.map((stat, index) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 + index * 0.05, ease: [0.22, 1, 0.36, 1] }}
                className="card-kpi p-5 lg:p-6 rounded-2xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="kpi-label">{stat.label}</span>
                  <div className={`p-2.5 rounded-xl ${stat.positive ? "bg-success/10 ring-1 ring-success/20" : "bg-destructive/10 ring-1 ring-destructive/20"}`}>
                    <stat.icon className={`w-4 h-4 lg:w-5 lg:h-5 ${stat.positive ? "text-success" : "text-destructive"}`} />
                  </div>
                </div>
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.4 + index * 0.05 }}
                  className="kpi-value lg:kpi-value-lg mb-3"
                >
                  {stat.value}
                </motion.div>
                <div className="h-1 w-full bg-secondary/40 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "60%" }}
                    transition={{ duration: 0.8, delay: 0.5 + index * 0.05, ease: "easeOut" }}
                    className={`h-full rounded-full ${stat.positive ? "bg-gradient-to-r from-success/60 to-success" : "bg-gradient-to-r from-destructive/60 to-destructive"}`}
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Premium Separator */}
          <div className="section-separator mb-6 flex-shrink-0" />

          {/* Main Content Grid */}
          <div className="flex-1 grid lg:grid-cols-3 gap-5 lg:gap-6 min-h-0 overflow-hidden">
            {isAdmin && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }} 
                animate={{ opacity: 1, x: 0 }} 
                transition={{ duration: 0.5, delay: 0.35 }} 
                className="lg:col-span-2 p-5 lg:p-6 rounded-2xl card-premium flex flex-col min-h-0"
              >
                <div className="flex items-center justify-between mb-5 flex-shrink-0">
                  <h2 className="section-title-premium flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    Analyse financière
                  </h2>
                  <div className="p-2 rounded-xl bg-secondary/50">
                    <BarChart3 className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
                <div className="flex-1 min-h-0">
                  {profile?.entreprise_id && (
                    <FinancialChart entrepriseId={profile.entreprise_id} />
                  )}
                </div>
              </motion.div>
            )}

            <motion.div 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ duration: 0.5, delay: 0.4 }} 
              className={`p-5 lg:p-6 rounded-2xl card-premium flex flex-col min-h-0 ${!isAdmin ? 'lg:col-span-2' : ''}`}
            >
              <div className="flex items-center justify-between mb-5 flex-shrink-0">
                <h2 className="section-title-premium flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  {isAdmin ? "Clients récents" : "Mes clients"}
                </h2>
                {isAdmin && (
                  <Button variant="ghost" size="icon" onClick={() => setClientDialogOpen(true)} className="hover:bg-primary/10 hover:text-primary transition-colors duration-300 rounded-xl h-9 w-9">
                    <Plus className="w-5 h-5" />
                  </Button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
                {clients.length > 0 ? (
                  clients.map((client, index) => (
                    <motion.div 
                      key={client.id} 
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.5 + index * 0.05 }}
                      className="flex items-center gap-4 p-3.5 rounded-xl bg-secondary/20 hover:bg-secondary/40 border border-transparent hover:border-border/30 transition-all duration-300 cursor-pointer group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors flex-shrink-0 ring-1 ring-primary/10">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm lg:text-base truncate">{client.nom}</div>
                        <div className="text-xs lg:text-sm text-muted-foreground truncate mt-0.5">{client.email || "Pas d'email"}</div>
                      </div>
                      <Link to={`/clients/${client.id}`} className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <Button variant="ghost" size="sm" className="h-8 px-3 text-sm hover:bg-primary/10 hover:text-primary rounded-lg">
                          Voir
                        </Button>
                      </Link>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">Aucun client</p>
                  </div>
                )}
              </div>
            </motion.div>

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
            onSuccess={fetchDashboardData}
          />
          <DevisDialog
            open={devisDialogOpen}
            onOpenChange={setDevisDialogOpen}
            entrepriseId={profile.entreprise_id}
            onSuccess={fetchDashboardData}
          />
          <FactureDialog
            open={factureDialogOpen}
            onOpenChange={setFactureDialogOpen}
            entrepriseId={profile.entreprise_id}
            onSuccess={fetchDashboardData}
          />
          <DepenseDialog
            open={depenseDialogOpen}
            onOpenChange={setDepenseDialogOpen}
            entrepriseId={profile.entreprise_id}
            onSuccess={fetchDashboardData}
          />
          <TacheDialog
            open={tacheDialogOpen}
            onOpenChange={setTacheDialogOpen}
            entrepriseId={profile.entreprise_id}
            onSuccess={fetchDashboardData}
          />
          <DocumentDialog
            open={documentDialogOpen}
            onOpenChange={setDocumentDialogOpen}
            entrepriseId={profile.entreprise_id}
            onSuccess={fetchDashboardData}
          />
        </>
      )}
    </div>
  );
};

export default Dashboard;
