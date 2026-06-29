import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Logo } from "./Logo";

export const Navbar = () => {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-3 sm:top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.5rem)] max-w-6xl"
    >
      <div className="rounded-full bg-background/70 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-between gap-2 px-3 sm:px-5 py-2 sm:py-2.5 min-w-0">
          <Link to="/" className="min-w-0 flex-shrink">
            <Logo size="sm" />
          </Link>

          <div className="hidden md:flex items-center gap-7">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Fonctionnalités
            </a>
            <a href="#how" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Processus
            </a>
            <a href="#benefits" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Avantages
            </a>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <Link
              to="/connexion"
              className="hidden sm:inline-flex px-3 py-1.5 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Connexion
            </Link>
            <Link
              to="/inscription"
              className="group inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium hover:shadow-[0_0_30px_hsl(var(--primary)/0.5)] transition-all duration-300"
            >
              Commencer
              <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};
