import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Crown, Sparkles, Calendar, FileText, Users, Zap, Infinity as InfinityIcon } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useEntreprise } from "@/hooks/useEntreprise";
import { supabase } from "@/integrations/supabase/client";
import { PLANS, type PlanId } from "@/lib/pricing/plans";

interface PlanLimits {
  factures: number | null; // null = illimité
  users: number | null;
}

const LIMITS: Record<string, PlanLimits> = {
  trial: { factures: 100, users: 2 },
  starter: { factures: 100, users: 2 },
  standard: { factures: 500, users: 5 },
  pro: { factures: null, users: null },
};

const PLAN_META: Record<string, { label: string; icon: string; gradient: string }> = {
  trial: { label: "Essai gratuit", icon: "🎁", gradient: "from-primary/20 via-primary/10 to-transparent" },
  starter: { label: "Starter", icon: "🚀", gradient: "from-emerald-500/20 via-emerald-500/5 to-transparent" },
  standard: { label: "Standard", icon: "👑", gradient: "from-primary/25 via-primary/10 to-transparent" },
  pro: { label: "Pro", icon: "💎", gradient: "from-violet-500/25 via-violet-500/10 to-transparent" },
};

const formatDate = (d: Date | null) => {
  if (!d) return "—";
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
};

export const SubscriptionCard = () => {
  const { plan, isTrial, isExpired, trialDaysLeft, trialEndsAt, isLoading } = useSubscription();
  const { entrepriseId } = useEntreprise();
  const [facturesCount, setFacturesCount] = useState(0);
  const [usersCount, setUsersCount] = useState(0);
  const [endDate, setEndDate] = useState<Date | null>(null);

  useEffect(() => {
    if (!entrepriseId) return;

    const load = async () => {
      const startMonth = new Date();
      startMonth.setDate(1);
      startMonth.setHours(0, 0, 0, 0);

      const [factRes, usersRes, subRes] = await Promise.all([
        supabase
          .from("factures")
          .select("id", { count: "exact", head: true })
          .eq("entreprise_id", entrepriseId)
          .gte("created_at", startMonth.toISOString()),
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("entreprise_id", entrepriseId),
        supabase
          .from("subscriptions")
          .select("end_date, trial_ends_at")
          .eq("entreprise_id", entrepriseId)
          .maybeSingle(),
      ]);

      setFacturesCount(factRes.count ?? 0);
      setUsersCount(usersRes.count ?? 0);
      const raw = subRes.data?.end_date || subRes.data?.trial_ends_at;
      setEndDate(raw ? new Date(raw) : trialEndsAt);
    };

    load();
  }, [entrepriseId, trialEndsAt]);

  if (isLoading) return null;

  const currentKey = isTrial ? "trial" : plan;
  const meta = PLAN_META[currentKey] ?? PLAN_META.trial;
  const limits = LIMITS[currentKey] ?? LIMITS.trial;

  const facturesPercent =
    limits.factures === null ? 0 : Math.min(100, Math.round((facturesCount / limits.factures) * 100));
  const usersPercent =
    limits.users === null ? 0 : Math.min(100, Math.round((usersCount / limits.users) * 100));

  const planData = PLANS.find((p) => p.id === (plan as PlanId));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br ${meta.gradient} p-4 sm:p-5`}
    >
      <div className="absolute -top-16 -right-16 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
        {/* Plan info */}
        <div className="flex items-center gap-3 lg:min-w-[220px]">
          <div className="w-12 h-12 rounded-xl bg-primary/15 ring-1 ring-primary/30 flex items-center justify-center text-2xl flex-shrink-0">
            {meta.icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Votre abonnement
              </span>
              {isTrial && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-bold uppercase">
                  Essai
                </span>
              )}
              {isExpired && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-destructive/20 text-destructive font-bold uppercase">
                  Expiré
                </span>
              )}
            </div>
            <div className="font-bold text-lg sm:text-xl leading-tight flex items-center gap-2">
              {meta.label}
              {plan === "pro" && !isTrial && <Crown className="w-4 h-4 text-primary" />}
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Calendar className="w-3 h-3" />
              {isTrial ? (
                <>
                  {trialDaysLeft > 0 ? (
                    <>Se termine dans <span className="text-primary font-semibold">{trialDaysLeft} j</span></>
                  ) : (
                    <>Terminé</>
                  )}
                </>
              ) : (
                <>Renouvellement le <span className="font-semibold text-foreground">{formatDate(endDate)}</span></>
              )}
            </div>
          </div>
        </div>

        {/* Usage bars */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Factures */}
          <div className="rounded-xl bg-background/40 backdrop-blur-sm border border-border/30 p-3">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <FileText className="w-3.5 h-3.5 text-primary" />
                Factures ce mois
              </div>
              <div className="text-xs font-bold">
                {facturesCount}
                <span className="text-muted-foreground font-normal">
                  {" / "}
                  {limits.factures === null ? (
                    <InfinityIcon className="w-3 h-3 inline" />
                  ) : (
                    limits.factures
                  )}
                </span>
              </div>
            </div>
            <div className="h-2 rounded-full bg-secondary/50 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: limits.factures === null ? "100%" : `${facturesPercent}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-full rounded-full ${
                  limits.factures === null
                    ? "bg-gradient-to-r from-violet-500 to-primary"
                    : facturesPercent > 85
                    ? "bg-gradient-to-r from-orange-500 to-red-500"
                    : "bg-gradient-to-r from-primary to-primary/70"
                }`}
              />
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">
              {limits.factures === null ? "Illimité" : `${facturesPercent}% utilisé`}
            </div>
          </div>

          {/* Users */}
          <div className="rounded-xl bg-background/40 backdrop-blur-sm border border-border/30 p-3">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Users className="w-3.5 h-3.5 text-primary" />
                Utilisateurs
              </div>
              <div className="text-xs font-bold">
                {usersCount}
                <span className="text-muted-foreground font-normal">
                  {" / "}
                  {limits.users === null ? <InfinityIcon className="w-3 h-3 inline" /> : limits.users}
                </span>
              </div>
            </div>
            <div className="h-2 rounded-full bg-secondary/50 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: limits.users === null ? "100%" : `${usersPercent}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
                className={`h-full rounded-full ${
                  limits.users === null
                    ? "bg-gradient-to-r from-violet-500 to-primary"
                    : usersPercent > 85
                    ? "bg-gradient-to-r from-orange-500 to-red-500"
                    : "bg-gradient-to-r from-primary to-primary/70"
                }`}
              />
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">
              {limits.users === null ? "Illimité" : `${usersPercent}% utilisé`}
            </div>
          </div>
        </div>

        {/* Price info sidenote */}
        {planData && !isTrial && (
          <div className="hidden xl:flex flex-col items-end text-right border-l border-border/30 pl-4">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-primary" />
              Facturation
            </div>
            <div className="text-sm font-bold">
              {planData.priceMonthly.toLocaleString("fr-FR")} GNF
            </div>
            <div className="text-[10px] text-muted-foreground">par mois</div>
          </div>
        )}
      </div>

      {/* Trial urgency banner */}
      {isTrial && trialDaysLeft <= 3 && (
        <div className="relative mt-3 flex items-center gap-2 text-xs bg-primary/10 border border-primary/30 rounded-lg px-3 py-2">
          <Zap className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          <span>
            Votre essai se termine bientôt. Contactez l'équipe pour activer votre abonnement.
          </span>
        </div>
      )}
    </motion.div>
  );
};
