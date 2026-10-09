import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Sparkles, ShieldCheck, ArrowRight } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { FloatingParticles } from "@/components/FloatingParticles";

const ALLOWED_PATHS = ["/tarifs", "/abonnement", "/parametres", "/profil-entreprise"];

export const TrialExpiredGate = ({ children }: { children: ReactNode }) => {
  const { isExpired, isLoading } = useSubscription();
  const { signOut } = useAuth();
  const location = useLocation();

  const isAllowed = ALLOWED_PATHS.some((p) => location.pathname.startsWith(p));

  if (isLoading || !isExpired || isAllowed) return <>{children}</>;

  return (
    <div className="min-h-screen mesh-gradient relative flex items-center justify-center p-4 overflow-hidden">
      <FloatingParticles count={30} />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 max-w-lg w-full rounded-3xl border border-primary/30 bg-gradient-to-br from-card via-card/90 to-background p-8 shadow-2xl"
      >
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-primary/20 blur-[100px] rounded-full pointer-events-none" />
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mb-5 mx-auto">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-center mb-2">
            Votre essai gratuit est terminé
          </h1>
          <p className="text-muted-foreground text-center mb-6">
            Passez à un forfait payant pour continuer à utiliser Optimum Immo.
            Toutes vos données sont conservées en toute sécurité et
            réapparaîtront immédiatement dès le paiement effectué.
          </p>

          <div className="space-y-2 mb-6">
            <div className="flex items-center gap-3 text-sm p-3 rounded-xl bg-primary/5 border border-primary/20">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
              <span>Vos données restent intactes et sécurisées</span>
            </div>
            <div className="flex items-center gap-3 text-sm p-3 rounded-xl bg-primary/5 border border-primary/20">
              <Sparkles className="w-4 h-4 text-primary shrink-0" />
              <span>Reprise instantanée dès l'activation du forfait</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Link to="/tarifs">
              <Button className="w-full rounded-xl gap-2 h-11">
                Voir les forfaits
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/abonnement">
              <Button variant="outline" className="w-full rounded-xl h-11">
                Mon abonnement
              </Button>
            </Link>
            <Button
              variant="ghost"
              className="w-full rounded-xl h-10 text-muted-foreground"
              onClick={() => signOut()}
            >
              Se déconnecter
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
