import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";

export const Navbar = () => {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/30"
    >
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between gap-2 h-16 min-w-0">
          <Link to="/" className="min-w-0 flex-shrink">
            <Logo size="md" />
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
              Fonctionnalités
            </a>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            <Button variant="ghost" size="sm" className="px-2.5 sm:px-4 text-xs sm:text-sm" asChild>
              <Link to="/connexion">Connexion</Link>
            </Button>
            <Button variant="hero" size="sm" className="px-3 sm:px-4 text-xs sm:text-sm max-[360px]:hidden" asChild>
              <Link to="/inscription">Commencer</Link>
            </Button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};
