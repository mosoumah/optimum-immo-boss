import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
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
  UserCog,
  Shield,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { useUserRole } from "@/hooks/useUserRole";

interface SidebarItem {
  icon: typeof LayoutDashboard;
  label: string;
  path: string;
  roles: ("admin" | "agent" | "client")[];
}

const sidebarItems: SidebarItem[] = [
  { icon: LayoutDashboard, label: "Tableau de bord", path: "/dashboard", roles: ["admin", "agent"] },
  { icon: Users, label: "Clients", path: "/clients", roles: ["admin", "agent"] },
  { icon: FileText, label: "Devis", path: "/devis", roles: ["admin", "agent"] },
  { icon: Receipt, label: "Factures", path: "/factures", roles: ["admin", "agent"] },
  { icon: TrendingUp, label: "Revenus", path: "/revenus", roles: ["admin"] },
  { icon: TrendingDown, label: "Dépenses", path: "/depenses", roles: ["admin"] },
  { icon: CheckSquare, label: "Tâches", path: "/taches", roles: ["admin", "agent"] },
  { icon: Sparkles, label: "Documents IA", path: "/documents-ia", roles: ["admin", "agent"] },
  { icon: UserCog, label: "Utilisateurs", path: "/utilisateurs", roles: ["admin"] },
  { icon: Shield, label: "Permissions", path: "/gestion-permissions", roles: ["admin"] },
];

interface DynamicSidebarProps {
  onSignOut: () => void;
}

export const DynamicSidebar = ({ onSignOut }: DynamicSidebarProps) => {
  const { role, isAdmin } = useUserRole();
  const location = useLocation();

  const filteredItems = sidebarItems.filter(
    (item) => role && item.roles.includes(role as "admin" | "agent" | "client")
  );

  return (
    <aside className="w-64 sidebar-gradient border-r border-border/30 flex flex-col fixed h-screen z-50">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="p-6"
      >
        <Logo size="sm" animated={false} />
      </motion.div>

      <nav className="flex-1 px-3 space-y-1">
        {filteredItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          return (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <Link
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/20 glow-primary-sm"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:translate-x-1"
                }`}
              >
                <item.icon
                  className={`w-5 h-5 transition-transform duration-300 ${
                    isActive ? "text-primary" : "group-hover:scale-110"
                  }`}
                />
                <span className="font-medium text-sm">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                  />
                )}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="p-3 space-y-1 border-t border-border/20"
      >
        {isAdmin && (
          <Link
            to="/parametres"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all duration-300 hover:translate-x-1"
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium text-sm">Paramètres</span>
          </Link>
        )}
        <button
          onClick={onSignOut}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-300 w-full"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium text-sm">Déconnexion</span>
        </button>
      </motion.div>
    </aside>
  );
};
