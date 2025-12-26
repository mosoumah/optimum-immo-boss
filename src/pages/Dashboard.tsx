import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileText,
  Receipt,
  TrendingUp,
  TrendingDown,
  CheckSquare,
  Sparkles,
  Settings,
  LogOut,
  Plus,
  ArrowUpRight,
  Bell,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ClientDialog } from "@/components/dialogs/ClientDialog";
import { DevisDialog } from "@/components/dialogs/DevisDialog";
import { FactureDialog } from "@/components/dialogs/FactureDialog";
import { DepenseDialog } from "@/components/dialogs/DepenseDialog";
import { TacheDialog } from "@/components/dialogs/TacheDialog";
import { DocumentDialog } from "@/components/dialogs/DocumentDialog";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Tableau de bord", path: "/dashboard", active: true },
  { icon: Users, label: "Clients", path: "/clients" },
  { icon: FileText, label: "Devis", path: "/devis" },
  { icon: Receipt, label: "Factures", path: "/factures" },
  { icon: TrendingUp, label: "Revenus", path: "/revenus" },
  { icon: TrendingDown, label: "Dépenses", path: "/depenses" },
  { icon: CheckSquare, label: "Tâches", path: "/taches" },
  { icon: Sparkles, label: "Documents IA", path: "/documents-ia" },
];

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

        const today = new Date().toISOString().split("T")[0];
        const { data: tachesData } = await supabase
          .from("taches")
          .select("id, titre, statut")
          .eq("entreprise_id", entrepriseId)
          .eq("date", today)
          .eq("statut", "a_faire")
          .limit(5);

        setTaches(tachesData || []);

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
  }, [user]);

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

  const statsDisplay = [
    { label: "Revenus du mois", value: formatCurrency(stats.revenus), positive: true, icon: TrendingUp },
    { label: "Dépenses du mois", value: formatCurrency(stats.depenses), positive: false, icon: TrendingDown },
    { label: "Bénéfice estimé", value: formatCurrency(stats.revenus - stats.depenses), positive: stats.revenus > stats.depenses, icon: TrendingUp },
    { label: "Factures non payées", value: String(stats.facturesNonPayees), positive: stats.facturesNonPayees === 0, icon: Receipt },
  ];

  const quickActions = [
    { label: "Nouveau client", icon: Users, onClick: () => setClientDialogOpen(true) },
    { label: "Nouveau devis", icon: FileText, onClick: () => setDevisDialogOpen(true) },
    { label: "Nouvelle facture", icon: Receipt, onClick: () => setFactureDialogOpen(true) },
    { label: "Nouvelle dépense", icon: TrendingDown, onClick: () => setDepenseDialogOpen(true) },
    { label: "Nouvelle tâche", icon: CheckSquare, onClick: () => setTacheDialogOpen(true) },
    { label: "Document IA", icon: Sparkles, onClick: () => setDocumentDialogOpen(true) },
  ];

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
    <div className="min-h-screen flex">
      <aside className="w-64 sidebar-gradient border-r border-border/30 flex flex-col fixed h-screen">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="p-6"
        >
          <Logo size="sm" animated={false} />
        </motion.div>

        <nav className="flex-1 px-3 space-y-1">
          {sidebarItems.map((item, index) => (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <Link
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                  item.active
                    ? "bg-primary/10 text-primary border border-primary/20 glow-primary-sm"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:translate-x-1"
                }`}
              >
                <item.icon className={`w-5 h-5 transition-transform duration-300 ${item.active ? "text-primary" : "group-hover:scale-110"}`} />
                <span className="font-medium text-sm">{item.label}</span>
                {item.active && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                  />
                )}
              </Link>
            </motion.div>
          ))}
        </nav>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="p-3 space-y-1 border-t border-border/20"
        >
          <Link
            to="/parametres"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all duration-300 hover:translate-x-1"
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium text-sm">Paramètres</span>
          </Link>
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-300 w-full"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">Déconnexion</span>
          </button>
        </motion.div>
      </aside>

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
                placeholder="Rechercher..." 
                className="pl-10 h-11 bg-secondary/30 border-border/30 rounded-xl focus:border-primary/50 focus:ring-primary/20 transition-all duration-300" 
              />
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-4"
            >
              <Button variant="ghost" size="icon" className="relative hover:bg-primary/10 transition-colors duration-300 rounded-xl">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-primary rounded-full animate-pulse" />
              </Button>
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center transition-all duration-300 hover:scale-105 hover:border-primary/50">
                <span className="text-sm font-bold text-primary">
                  {profile?.nom?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "U"}
                </span>
              </div>
            </motion.div>
          </div>
        </header>

        <div className="p-8">
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mb-10"
          >
            <h1 className="text-4xl font-bold mb-3">
              Bonjour, <span className="text-gradient">{profile?.nom?.split(" ")[0] || "Utilisateur"}</span> 👋
            </h1>
            <p className="text-muted-foreground text-lg">Voici un aperçu de votre activité aujourd'hui</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5, delay: 0.15 }} 
            className="flex flex-wrap gap-3 mb-10"
          >
            {quickActions.map((action, index) => (
              <motion.div
                key={action.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
              >
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={action.onClick}
                  className="action-button border-border/30 hover:border-primary/40 rounded-xl h-10 px-4"
                >
                  <Plus className="w-4 h-4 mr-2 text-primary" />
                  {action.label}
                </Button>
              </motion.div>
            ))}
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ duration: 0.6, delay: 0.25 }} 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10"
          >
            {statsDisplay.map((stat, index) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="card-stat p-6 rounded-2xl border border-border/30 hover:border-primary/30"
              >
                <div className="flex items-center justify-between mb-5">
                  <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
                  <div className={`p-2.5 rounded-xl ${stat.positive ? "card-stat-positive" : "card-stat-negative"}`}>
                    <stat.icon className={`w-5 h-5 ${stat.positive ? "text-success" : "text-destructive"}`} />
                  </div>
                </div>
                <motion.div 
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                  className="text-3xl font-bold mb-2"
                >
                  {stat.value}
                </motion.div>
                <div className="h-1 w-full bg-secondary/50 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "60%" }}
                    transition={{ duration: 1, delay: 0.6 + index * 0.1, ease: "easeOut" }}
                    className={`h-full rounded-full ${stat.positive ? "bg-gradient-to-r from-success/50 to-success" : "bg-gradient-to-r from-destructive/50 to-destructive"}`}
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-6">
            <motion.div 
              initial={{ opacity: 0, x: -30 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ duration: 0.6, delay: 0.5 }} 
              className="lg:col-span-2 p-6 rounded-2xl card-gradient border border-border/30 hover:border-primary/20 transition-all duration-500"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  Tâches du jour
                </h2>
                <Button variant="ghost" size="sm" asChild className="hover:bg-primary/10 hover:text-primary transition-colors duration-300 rounded-lg">
                  <Link to="/taches">Voir tout<ArrowUpRight className="w-4 h-4 ml-1" /></Link>
                </Button>
              </div>
              <div className="space-y-3">
                {taches.length > 0 ? (
                  taches.map((task, index) => (
                    <motion.div 
                      key={task.id} 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                      className="flex items-center gap-4 p-4 rounded-xl bg-secondary/20 border border-border/20 hover:border-primary/20 hover:bg-secondary/30 transition-all duration-300 group"
                    >
                      <div className="w-3 h-3 rounded-full bg-warning animate-pulse" />
                      <span className="flex-1 text-sm font-medium">{task.titre}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => markTaskDone(task.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-success/10 hover:text-success rounded-lg"
                      >
                        Terminer
                      </Button>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-muted-foreground text-sm text-center py-12 flex flex-col items-center gap-3">
                    <CheckSquare className="w-12 h-12 text-muted-foreground/30" />
                    <span>Aucune tâche pour aujourd'hui</span>
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 30 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ duration: 0.6, delay: 0.6 }} 
              className="p-6 rounded-2xl card-gradient border border-border/30 hover:border-primary/20 transition-all duration-500"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  Clients récents
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setClientDialogOpen(true)} className="hover:bg-primary/10 hover:text-primary transition-colors duration-300 rounded-lg">
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
              <div className="space-y-4">
                {clients.length > 0 ? (
                  clients.map((client, index) => (
                    <motion.div 
                      key={client.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.7 + index * 0.1 }}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/30 transition-all duration-300 cursor-pointer group"
                    >
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center transition-all duration-300 group-hover:border-primary/40 group-hover:scale-105">
                        <span className="text-sm font-bold text-primary">{client.nom.split(" ").map(n => n[0]).join("").slice(0, 2)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate group-hover:text-primary transition-colors duration-300">{client.nom}</div>
                        <div className="text-xs text-muted-foreground truncate">{client.email || "Pas d'email"}</div>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:text-primary" />
                    </motion.div>
                  ))
                ) : (
                  <div className="text-muted-foreground text-sm text-center py-8 flex flex-col items-center gap-3">
                    <Users className="w-12 h-12 text-muted-foreground/30" />
                    <span>Aucun client pour le moment</span>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {profile?.entreprise_id && (
        <>
          <ClientDialog open={clientDialogOpen} onOpenChange={setClientDialogOpen} entrepriseId={profile.entreprise_id} onSuccess={fetchDashboardData} />
          <DevisDialog open={devisDialogOpen} onOpenChange={setDevisDialogOpen} entrepriseId={profile.entreprise_id} onSuccess={fetchDashboardData} />
          <FactureDialog open={factureDialogOpen} onOpenChange={setFactureDialogOpen} entrepriseId={profile.entreprise_id} onSuccess={fetchDashboardData} />
          <DepenseDialog open={depenseDialogOpen} onOpenChange={setDepenseDialogOpen} entrepriseId={profile.entreprise_id} onSuccess={fetchDashboardData} />
          <TacheDialog open={tacheDialogOpen} onOpenChange={setTacheDialogOpen} entrepriseId={profile.entreprise_id} onSuccess={fetchDashboardData} />
          <DocumentDialog open={documentDialogOpen} onOpenChange={setDocumentDialogOpen} entrepriseId={profile.entreprise_id} onSuccess={fetchDashboardData} />
        </>
      )}
    </div>
  );
};

export default Dashboard;
