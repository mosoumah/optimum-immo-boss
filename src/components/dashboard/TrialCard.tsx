import { motion } from "framer-motion";
import { Gift, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useSubscription } from "@/hooks/useSubscription";

export const TrialCard = () => {
  const { isTrial, trialDaysLeft, isExpired, isLoading } = useSubscription();

  if (isLoading) return null;
  if (!isTrial && !isExpired) return null;

  const percent = isExpired ? 100 : Math.max(0, Math.min(100, ((14 - trialDaysLeft) / 14) * 100));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl p-4 sm:p-5 border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent"
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
            <Gift className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-bold text-sm sm:text-base">
                {isExpired ? "Essai terminé" : "Essai gratuit"}
              </span>
              {!isExpired && (
                <span className="text-xs text-muted-foreground">
                  Il vous reste <span className="font-bold text-primary">{trialDaysLeft} jour{trialDaysLeft > 1 ? "s" : ""}</span>
                </span>
              )}
            </div>
            <Progress value={percent} className="h-1.5 mt-2" />
          </div>
        </div>
        <Link to="/tarifs" className="flex-shrink-0">
          <Button size="sm" className="rounded-xl font-semibold gap-1.5">
            Voir les abonnements
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>
    </motion.div>
  );
};
