import { Link } from "react-router-dom";
import { Lock, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PlanUpgradeNoticeProps {
  /** Message du type "Disponible avec la formule Pro". */
  message: string;
  variant?: "block" | "inline" | "badge";
  className?: string;
}

/**
 * Verrou visuel affiché lorsque la formule ne couvre pas une fonctionnalité.
 * Le quota est appliqué côté serveur : ce composant ne fait que prévenir et
 * proposer les formules.
 */
export const PlanUpgradeNotice = ({
  message,
  variant = "block",
  className,
}: PlanUpgradeNoticeProps) => {
  if (variant === "badge") {
    return (
      <Link
        to="/abonnement"
        className={cn(
          "inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary",
          className,
        )}
      >
        <Lock className="w-3 h-3" />
        {message}
      </Link>
    );
  }

  if (variant === "inline") {
    return (
      <Link to="/abonnement" className={cn("inline-flex items-center gap-1.5 text-xs text-primary hover:underline", className)}>
        <Lock className="w-3.5 h-3.5" />
        {message}
        <ArrowUpRight className="w-3 h-3" />
      </Link>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center",
        className,
      )}
    >
      <Lock className="w-8 h-8 text-primary mx-auto mb-3" />
      <h3 className="font-bold mb-1">Fonctionnalité non incluse</h3>
      <p className="text-sm text-muted-foreground mb-4">{message}</p>
      <Link to="/abonnement">
        <Button className="rounded-xl gap-2">
          Voir les formules
          <ArrowUpRight className="w-4 h-4" />
        </Button>
      </Link>
    </div>
  );
};
