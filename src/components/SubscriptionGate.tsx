import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import type { FeatureKey } from "@/lib/pricing/features";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  feature?: FeatureKey;
  fallbackInline?: boolean;
}

export const SubscriptionGate = ({ children, feature, fallbackInline }: Props) => {
  const { isBlocked, canUse, isLoading } = useSubscription();

  if (isLoading) return <>{children}</>;

  const allowed = feature ? canUse(feature) : !isBlocked;
  if (allowed) return <>{children}</>;

  if (fallbackInline) {
    return (
      <Link to="/tarifs">
        <Button variant="outline" size="sm" className="gap-1.5 border-primary/40 text-primary hover:bg-primary/10">
          <Lock className="w-3.5 h-3.5" />
          Abonnement requis
        </Button>
      </Link>
    );
  }

  return (
    <div className="p-6 rounded-2xl border border-primary/30 bg-primary/5 text-center">
      <Lock className="w-8 h-8 text-primary mx-auto mb-3" />
      <h3 className="font-bold mb-1">Votre essai est terminé</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Choisissez un forfait pour continuer à utiliser cette fonctionnalité.
      </p>
      <Link to="/tarifs">
        <Button className="rounded-xl">Voir les forfaits</Button>
      </Link>
    </div>
  );
};
