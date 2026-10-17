import { Link, useLocation } from "react-router-dom";
import { AlertTriangle, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";

/**
 * Bandeau global « Abonnement expiré, lecture seule ».
 *
 * Piloté par `is_expired` de useSubscription (hook non modifié). Le serveur
 * faisant autorité sur les écritures, ce bandeau est purement informatif : il
 * n'active ni ne désactive aucun contrôle.
 *
 * N'apparaît ni pendant l'essai, ni avec un abonnement actif, ni sur la page
 * Abonnement (qui doit rester accessible pour payer).
 */
export const SubscriptionExpiredBanner = () => {
  const { user } = useAuth();
  const { isExpired, isTrial, isLoading } = useSubscription();
  const location = useLocation();

  if (!user || isLoading || !isExpired || isTrial) return null;
  if (location.pathname.startsWith("/abonnement")) return null;

  return (
    <div className="w-full bg-destructive/15 border-b border-destructive/40 text-destructive">
      <div className="max-w-6xl mx-auto px-4 py-2 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-2 flex-1">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <p className="text-sm font-semibold">Abonnement expiré, lecture seule</p>
        </div>
        <Button asChild size="sm" variant="outline" className="rounded-lg gap-1.5 border-destructive/50 text-destructive hover:bg-destructive/10 self-start sm:self-auto">
          <Link to="/abonnement">
            Voir les abonnements
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
};
