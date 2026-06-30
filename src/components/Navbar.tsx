import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Logo } from "./Logo";

export const Navbar = () => {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-3 sm:top-5 inset-x-0 z-50 flex justify-center px-3 pointer-events-none"
    >
      <div className="relative pointer-events-auto w-full max-w-5xl">
        {/* Aurora glow halo */}
        <div
          aria-hidden
          className="absolute -inset-x-10 -inset-y-6 -z-10 opacity-70 blur-2xl"
          style={{
            background:
              "radial-gradient(60% 80% at 50% 50%, hsl(var(--primary) / 0.18), transparent 70%)",
          }}
        />

        {/* Static lime sheen border */}
        <div
          aria-hidden
          className="absolute inset-0 rounded-full overflow-hidden pointer-events-none"
          style={{
            padding: "1px",
            background:
              "linear-gradient(135deg, hsl(var(--primary) / 0.55) 0%, transparent 45%, transparent 55%, hsl(var(--primary) / 0.35) 100%)",
            WebkitMask:
              "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
          }}
        />

        <div className="relative rounded-full bg-background/40 backdrop-blur-2xl border border-white/10 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.06)] overflow-hidden">
          {/* Glass highlight */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none opacity-60"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 35%, rgba(255,255,255,0) 100%)",
            }}
          />
          {/* Shimmer sweep */}
          <motion.div
            aria-hidden
            className="absolute inset-y-0 w-1/3 pointer-events-none"
            style={{
              background:
                "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.12), transparent)",
            }}
            initial={{ x: "-120%" }}
            animate={{ x: "320%" }}
            transition={{ duration: 6, ease: "easeInOut", repeat: Infinity, repeatDelay: 2 }}
          />

          <div className="relative flex items-center justify-between gap-3 px-4 sm:px-6 py-2.5 min-w-0">
            <Link to="/" className="min-w-0 flex-shrink group">
              <motion.div
                whileHover={{ scale: 1.03 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Logo size="sm" />
              </motion.div>
            </Link>

            <div className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
              {[
                { href: "#features", label: "Fonctionnalités" },
                { href: "#how", label: "Processus" },
                { href: "#benefits", label: "Avantages" },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="relative px-3.5 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                >
                  <span className="relative z-10">{item.label}</span>
                  <span className="absolute inset-0 rounded-full bg-white/0 group-hover:bg-white/[0.06] transition-colors" />
                  <span className="absolute left-1/2 -translate-x-1/2 bottom-0.5 h-px w-0 group-hover:w-6 bg-primary transition-all duration-300" />
                </a>
              ))}
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
                className="group relative inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_hsl(var(--primary)/0.55)]"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative">Commencer</span>
                <ArrowUpRight className="relative w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};
