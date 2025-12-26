import { Logo } from "./Logo";

export const Footer = () => {
  return (
    <footer className="border-t border-border/30 py-12 mt-20">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <Logo size="sm" animated={false} />
          
          <div className="flex items-center gap-8 text-sm text-muted-foreground">
            <span className="hover:text-foreground transition-colors cursor-pointer">Mentions légales</span>
            <span className="hover:text-foreground transition-colors cursor-pointer">Confidentialité</span>
            <span className="hover:text-foreground transition-colors cursor-pointer">CGU</span>
          </div>
          
          <p className="text-sm text-muted-foreground">
            © 2024 Optimum Immo. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
};
