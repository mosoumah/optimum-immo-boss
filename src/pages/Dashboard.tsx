import { motion } from "framer-motion";
import { Link } from "react-router-dom";
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

const stats = [
  { label: "Revenus du mois", value: "45.2M GNF", change: "+12%", positive: true, icon: TrendingUp },
  { label: "Dépenses du mois", value: "12.8M GNF", change: "+5%", positive: false, icon: TrendingDown },
  { label: "Bénéfice estimé", value: "32.4M GNF", change: "+18%", positive: true, icon: TrendingUp },
  { label: "Factures non payées", value: "8", change: "3 en retard", positive: false, icon: Receipt },
];

const tasks = [
  { title: "Relancer devis #0024 - M. Diallo", priority: "high" },
  { title: "Facture #0089 arrive à échéance", priority: "medium" },
  { title: "Appeler Mme. Camara pour suivi", priority: "low" },
];

const recentClients = [
  { name: "Mamadou Diallo", email: "m.diallo@email.com", status: "actif" },
  { name: "Fatoumata Camara", email: "f.camara@email.com", status: "actif" },
  { name: "Ibrahima Sow", email: "i.sow@email.com", status: "prospect" },
];

const Dashboard = () => {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
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
          <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors w-full">
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
          <div className="flex items-center justify-between px-8 py-4">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                className="pl-10 h-10 bg-secondary/50 border-border/50"
              />
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
              </Button>
              <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                <span className="text-sm font-bold text-primary">JD</span>
              </div>
            </div>
          </div>
        </header>

        <div className="p-8">
          {/* Welcome */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold mb-2">Bonjour, Jean 👋</h1>
            <p className="text-muted-foreground">
              Voici un aperçu de votre activité aujourd'hui
            </p>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap gap-3 mb-8"
          >
            {[
              { label: "Nouveau devis", icon: FileText },
              { label: "Nouvelle facture", icon: Receipt },
              { label: "Nouvelle dépense", icon: TrendingDown },
              { label: "Nouvelle tâche", icon: CheckSquare },
              { label: "Document IA", icon: Sparkles },
            ].map((action) => (
              <Button key={action.label} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                {action.label}
              </Button>
            ))}
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          >
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className="p-6 rounded-xl card-gradient border border-border/50 hover:border-primary/30 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                  <div className={`p-2 rounded-lg ${stat.positive ? "bg-success/10" : "bg-destructive/10"}`}>
                    <stat.icon className={`w-4 h-4 ${stat.positive ? "text-success" : "text-destructive"}`} />
                  </div>
                </div>
                <div className="text-2xl font-bold mb-1">{stat.value}</div>
                <div className={`text-sm ${stat.positive ? "text-success" : "text-destructive"}`}>
                  {stat.change}
                </div>
              </div>
            ))}
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Tasks */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-2 p-6 rounded-xl card-gradient border border-border/50"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Tâches du jour</h2>
                <Button variant="ghost" size="sm">
                  Voir tout
                  <ArrowUpRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
              <div className="space-y-3">
                {tasks.map((task, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-4 rounded-lg bg-secondary/30 border border-border/30 hover:border-primary/20 transition-colors"
                  >
                    <div className={`w-2 h-2 rounded-full ${
                      task.priority === "high" ? "bg-destructive" :
                      task.priority === "medium" ? "bg-warning" : "bg-success"
                    }`} />
                    <span className="flex-1 text-sm">{task.title}</span>
                    <Button variant="ghost" size="sm">Terminer</Button>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Recent Clients */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="p-6 rounded-xl card-gradient border border-border/50"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Clients récents</h2>
                <Button variant="ghost" size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-4">
                {recentClients.map((client, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {client.name.split(" ").map(n => n[0]).join("")}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{client.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{client.email}</div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      client.status === "actif" ? "bg-success/10 text-success" : "bg-info/10 text-info"
                    }`}>
                      {client.status}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
