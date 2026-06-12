import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  FileText,
  Receipt,
  TrendingUp,
  TrendingDown,
  CheckSquare,
  
  ImagePlus,
  Settings,
  LogOut,
  UserCog,
  Shield,
  Menu,
  X,
  Building,
  CalendarCheck,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { useUserRole } from "@/hooks/useUserRole";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAgencySettings } from "@/hooks/useAgencySettings";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface SidebarItem {
  icon: typeof LayoutDashboard;
  label: string;
  path: string;
  roles: ("admin" | "agent")[];
  requires?: "vente" | "location";
}

const sidebarItems: SidebarItem[] = [
  { icon: LayoutDashboard, label: "Tableau de bord", path: "/dashboard", roles: ["admin", "agent"] },
  { icon: Users, label: "Clients", path: "/clients", roles: ["admin", "agent"] },
  { icon: Building, label: "Biens", path: "/biens", roles: ["admin", "agent"] },
  { icon: CalendarCheck, label: "Réservations", path: "/reservations", roles: ["admin", "agent"] },
  { icon: Receipt, label: "Factures", path: "/factures", roles: ["admin", "agent"] },
  { icon: TrendingUp, label: "Revenus", path: "/revenus", roles: ["admin"] },
  { icon: TrendingDown, label: "Dépenses", path: "/depenses", roles: ["admin"] },
  { icon: CheckSquare, label: "Tâches", path: "/taches", roles: ["admin", "agent"] },
  
  
  { icon: UserCog, label: "Utilisateurs", path: "/utilisateurs", roles: ["admin"] },
  { icon: Shield, label: "Permissions", path: "/gestion-permissions", roles: ["admin"] },
];

interface DynamicSidebarProps {
  onSignOut: () => void;
}

export const DynamicSidebar = ({ onSignOut }: DynamicSidebarProps) => {
  const { role, isAdmin } = useUserRole();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { venteEnabled, locationEnabled } = useAgencySettings();
  const [isOpen, setIsOpen] = useState(false);

  const filteredItems = sidebarItems.filter((item) => {
    if (!role || !item.roles.includes(role as "admin" | "agent")) return false;
    if (item.requires === "vente" && !venteEnabled) return false;
    if (item.requires === "location" && !locationEnabled) return false;
    return true;
  });

  const handleLinkClick = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };

  const sidebarContent = (
    <>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="p-2 flex items-center justify-between"
      >
        <Logo size="sm" animated={false} />
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="lg:hidden hover:bg-primary/10"
          >
            <X className="w-5 h-5" />
          </Button>
        )}
      </motion.div>

      <nav className="flex-1 px-3 space-y-0 overflow-hidden">
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
                onClick={handleLinkClick}
                className={`flex items-center gap-3 px-3 py-1.5 rounded-xl transition-all duration-300 group ${
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/20 glow-primary-sm"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:translate-x-1"
                }`}
              >
                <item.icon
                  className={`w-[18px] h-[18px] transition-transform duration-300 ${
                    isActive ? "text-primary" : "group-hover:scale-110"
                  }`}
                />
                <span className="font-medium text-[13px]">{item.label}</span>
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
        className="p-2 space-y-0 border-t border-border/20"
      >
        {isAdmin && (
          <Link
            to="/parametres"
            onClick={handleLinkClick}
            className="flex items-center gap-3 px-3 py-1.5 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all duration-300 hover:translate-x-1"
          >
            <Settings className="w-[18px] h-[18px]" />
            <span className="font-medium text-[13px]">Paramètres</span>
          </Link>
        )}
        <button
          onClick={onSignOut}
          className="flex items-center gap-3 px-3 py-1.5 rounded-xl text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-300 w-full"
        >
          <LogOut className="w-[18px] h-[18px]" />
          <span className="font-medium text-[13px]">Déconnexion</span>
        </button>
      </motion.div>
    </>
  );

  // Mobile: Hamburger button + overlay sidebar
  if (isMobile) {
    return (
      <>
        {/* Hamburger button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(true)}
          aria-label="Ouvrir le menu"
          className="fixed top-2.5 left-3 z-40 lg:hidden h-11 w-11 bg-card/80 backdrop-blur-md border border-border/40 shadow-lg hover:bg-primary/10 rounded-xl"
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* Overlay */}
        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 lg:hidden"
              />
              <motion.aside
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="w-[85vw] max-w-sm sidebar-gradient border-r border-border/30 flex flex-col fixed h-screen z-50 pb-[env(safe-area-inset-bottom)] overflow-y-auto"
              >
                {sidebarContent}
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Desktop: Fixed sidebar
  return (
    <aside className="w-64 sidebar-gradient border-r border-border/30 flex flex-col fixed h-screen z-50 hidden lg:flex">
      {sidebarContent}
    </aside>
  );
};
