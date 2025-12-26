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
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col fixed h-screen">
        <div className="p-6">
          <Logo size="sm" animated={false} />
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {sidebarItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                item.active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-3 space-y-1 border-t border-sidebar-border">
          <Link
            to="/parametres"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium text-sm">Paramètres</span>
          </Link>
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors w-full"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">Déconnexion</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-64">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
          <div className="flex items-center justify-between px-8 py-4">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input placeholder="Rechercher..." className="pl-10 h-10 bg-secondary/50 border-border/50" />
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
              </Button>
              <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                <span className="text-sm font-bold text-primary">
                  {profile?.nom?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "U"}
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="p-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Bonjour, {profile?.nom?.split(" ")[0] || "Utilisateur"} 👋</h1>
            <p className="text-muted-foreground">Voici un aperçu de votre activité aujourd'hui</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-wrap gap-3 mb-8">
            {quickActions.map((action) => (
              <Button key={action.label} variant="outline" size="sm" onClick={action.onClick}>
                <Plus className="w-4 h-4 mr-1" />
                {action.label}
              </Button>
            ))}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statsDisplay.map((stat) => (
              <div key={stat.label} className="p-6 rounded-xl card-gradient border border-border/50 hover:border-primary/30 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                  <div className={`p-2 rounded-lg ${stat.positive ? "bg-success/10" : "bg-destructive/10"}`}>
                    <stat.icon className={`w-4 h-4 ${stat.positive ? "text-success" : "text-destructive"}`} />
                  </div>
                </div>
                <div className="text-2xl font-bold mb-1">{stat.value}</div>
              </div>
            ))}
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2 p-6 rounded-xl card-gradient border border-border/50">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Tâches du jour</h2>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/taches">Voir tout<ArrowUpRight className="w-4 h-4 ml-1" /></Link>
                </Button>
              </div>
              <div className="space-y-3">
                {taches.length > 0 ? (
                  taches.map((task) => (
                    <div key={task.id} className="flex items-center gap-4 p-4 rounded-lg bg-secondary/30 border border-border/30 hover:border-primary/20 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-warning" />
                      <span className="flex-1 text-sm">{task.titre}</span>
                      <Button variant="ghost" size="sm" onClick={() => markTaskDone(task.id)}>Terminer</Button>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm text-center py-8">Aucune tâche pour aujourd'hui</p>
                )}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="p-6 rounded-xl card-gradient border border-border/50">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Clients récents</h2>
                <Button variant="ghost" size="sm" onClick={() => setClientDialogOpen(true)}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-4">
                {clients.length > 0 ? (
                  clients.map((client) => (
                    <div key={client.id} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                        <span className="text-sm font-medium">{client.nom.split(" ").map(n => n[0]).join("").slice(0, 2)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{client.nom}</div>
                        <div className="text-xs text-muted-foreground truncate">{client.email || "Pas d'email"}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm text-center py-4">Aucun client pour le moment</p>
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
