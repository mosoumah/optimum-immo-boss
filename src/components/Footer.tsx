import { Logo } from "./Logo";

export const Footer = () => {
  return (
    <footer className="mt-20">
      <div className="container mx-auto px-6">
        <div className="card-glow rounded-2xl p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Logo size="sm" animated={false} />
            
            <div className="flex items-center gap-8 text-sm text-muted-foreground">
              <span className="cursor-default" title="À venir">Mentions légales</span>
              <span className="cursor-default" title="À venir">Confidentialité</span>
              <span className="cursor-default" title="À venir">CGU</span>
            </div>
            
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Optimum Immo. Tous droits réservés.
            </p>
          </div>
        </div>
      </div>
      <div className="py-6" />
    </footer>
  );
};
