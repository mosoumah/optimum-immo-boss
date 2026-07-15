import { Link } from "react-router-dom";
import { Logo } from "./Logo";

export const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-4 border-t border-white/5">
      <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="container mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-5">
            <Logo size="md" animated={false} />
            <p className="mt-5 text-sm text-muted-foreground max-w-sm leading-relaxed">
              La plateforme premium qui propulse les agences immobilières guinéennes.
              Conçue avec rigueur, pensée pour durer.
            </p>
            <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Disponible en Guinée
            </div>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-4">Produit</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#features" className="text-foreground/80 hover:text-primary transition-colors">Fonctionnalités</a></li>
              <li><a href="#how" className="text-foreground/80 hover:text-primary transition-colors">Processus</a></li>
              <li><a href="#benefits" className="text-foreground/80 hover:text-primary transition-colors">Avantages</a></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-4">Accès</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/connexion" className="text-foreground/80 hover:text-primary transition-colors">Connexion</Link></li>
              <li><Link to="/inscription" className="text-foreground/80 hover:text-primary transition-colors">Créer un compte</Link></li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <h4 className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-4">Légal</h4>
            <ul className="space-y-2.5 text-sm text-foreground/80">
              <li>Données sécurisées</li>
              <li>Conforme RGPD</li>
              <li>Hébergement européen</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {year} Optimum Immo — Conçu pour les professionnels de l'immobilier.
          </p>
          <p className="font-display italic text-sm text-muted-foreground">
            Pensez immobilier. Pensez <span className="text-primary not-italic font-sans font-medium">optimum</span>.
          </p>
        </div>
      </div>
    </footer>
  );
};
