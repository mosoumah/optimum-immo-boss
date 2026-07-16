import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Sparkles,
  Crown,
  Rocket,
  Gem,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Receipt,
  Users,
  Building2,
  CalendarCheck,
  Infinity as InfinityIcon,
  ShieldCheck,
  Zap,
} from "lucide-react";
import {
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Activity } from "lucide-react";
import { FloatingParticles } from "@/components/FloatingParticles";
import { DynamicSidebar } from "@/components/DynamicSidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEntreprise } from "@/hooks/useEntreprise";
import { useSubscription } from "@/hooks/useSubscription";
import { PLANS, formatGNF, type PlanId } from "@/lib/pricing/plans";

const PLAN_ICON: Record<string, typeof Rocket> = {
  trial: Sparkles,
  starter: Rocket,
  standard: Crown,
  pro: Gem,
};

const PLAN_LABEL: Record<string, string> = {
  trial: "Essai gratuit",
  starter: "Starter",
  standard: "Standard",
  pro: "Pro",
};

// Plan quotas (null = illimité)
interface PlanQuota {
  factures_mois: number | null;
  utilisateurs: number | null;
  biens: number | null;
  reservations_mois: number | null;
}

const PLAN_QUOTAS: Record<string, PlanQuota> = {
  trial: { factures_mois: 100, utilisateurs: 2, biens: null, reservations_mois: null },
  starter: { factures_mois: 100, utilisateurs: 2, biens: null, reservations_mois: null },
  standard: { factures_mois: 500, utilisateurs: 5, biens: null, reservations_mois: null },
  pro: { factures_mois: null, utilisateurs: null, biens: null, reservations_mois: null },
};

interface WeekPoint {
  label: string;
  factures: number;
  reservations: number;
}

interface UsageCounts {
  factures_mois: number;
  utilisateurs: number;
  biens: number;
  reservations_mois: number;
}

const startOfWeek = (d: Date) => {
  const day = d.getDay();
  const diff = (day + 6) % 7;
  const res = new Date(d);
  res.setHours(0, 0, 0, 0);
  res.setDate(res.getDate() - diff);
  return res;
};

const fmtDay = (d: Date) =>
  d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });

const Abonnement = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { entrepriseId, isLoading: entrepriseLoading } = useEntreprise();
  const {
    plan,
    status,
    isTrial,
    trialDaysLeft,
    trialEndsAt,
    billingCycle,
    isExpired,
    isLoading: subLoading,
  } = useSubscription();

  const [weeks, setWeeks] = useState<WeekPoint[]>([]);
  const [usage, setUsage] = useState<UsageCounts>({
    factures_mois: 0,
    utilisateurs: 0,
    biens: 0,
    reservations_mois: 0,
  });
  const [loading, setLoading] = useState(true);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const fetchData = useCallback(async () => {
    if (!entrepriseId) return;
    setLoading(true);

    const now = new Date();

    // Weekly range: 4 weeks (this + 3 previous)
    const currentWeekStart = startOfWeek(now);
    const weekStarts: Date[] = [];
    for (let i = 3; i >= 0; i--) {
      const d = new Date(currentWeekStart);
      d.setDate(d.getDate() - i * 7);
      weekStarts.push(d);
    }
    const rangeStart = weekStarts[0];
    const rangeEnd = new Date(currentWeekStart);
    rangeEnd.setDate(rangeEnd.getDate() + 7);

    // Month range for quota counters
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      facturesWeekRes,
      reservationsWeekRes,
      facturesMonthRes,
      reservationsMonthRes,
      utilisateursRes,
      biensRes,
    ] = await Promise.all([
      supabase
        .from("factures")
        .select("created_at")
        .eq("entreprise_id", entrepriseId)
        .gte("created_at", rangeStart.toISOString())
        .lt("created_at", rangeEnd.toISOString()),
      supabase
        .from("reservations")
        .select("created_at")
        .eq("entreprise_id", entrepriseId)
        .gte("created_at", rangeStart.toISOString())
        .lt("created_at", rangeEnd.toISOString()),
      supabase
        .from("factures")
        .select("id", { count: "exact", head: true })
        .eq("entreprise_id", entrepriseId)
        .gte("created_at", monthStart.toISOString()),
      supabase
        .from("reservations")
        .select("id", { count: "exact", head: true })
        .eq("entreprise_id", entrepriseId)
        .gte("created_at", monthStart.toISOString()),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("entreprise_id", entrepriseId),
      supabase
        .from("properties")
        .select("id", { count: "exact", head: true })
        .eq("entreprise_id", entrepriseId),
    ]);

    const bucket = (d: Date) => {
      for (let i = weekStarts.length - 1; i >= 0; i--) {
        if (d >= weekStarts[i]) return i;
      }
      return -1;
    };

    const points: WeekPoint[] = weekStarts.map((ws, i) => {
      const we = new Date(ws);
      we.setDate(we.getDate() + 6);
      return {
        label:
          i === weekStarts.length - 1
            ? "Cette sem."
            : `${fmtDay(ws)}`,
        factures: 0,
        reservations: 0,
      };
    });

    (facturesWeekRes.data ?? []).forEach((r) => {
      const idx = bucket(new Date(r.created_at));
      if (idx >= 0) points[idx].factures += 1;
    });
    (reservationsWeekRes.data ?? []).forEach((r) => {
      const idx = bucket(new Date(r.created_at));
      if (idx >= 0) points[idx].reservations += 1;
    });

    setWeeks(points);
    setUsage({
      factures_mois: facturesMonthRes.count ?? 0,
      reservations_mois: reservationsMonthRes.count ?? 0,
      utilisateurs: utilisateursRes.count ?? 0,
      biens: biensRes.count ?? 0,
    });
    setLoading(false);
  }, [entrepriseId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (entrepriseLoading || subLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const PlanIcon = PLAN_ICON[plan] ?? Sparkles;
  const planLabel = PLAN_LABEL[plan] ?? plan;
  const planData = PLANS.find((p) => p.id === (plan as PlanId));
  const quota = PLAN_QUOTAS[plan] ?? PLAN_QUOTAS.trial;

  const quotaItems: {
    key: keyof UsageCounts;
    label: string;
    icon: typeof Receipt;
    used: number;
    limit: number | null;
    accent: string;
    hint: string;
  }[] = [
    {
      key: "factures_mois",
      label: "Factures ce mois",
      icon: Receipt,
      used: usage.factures_mois,
      limit: quota.factures_mois,
      accent: "text-primary",
      hint: "Réinitialisé chaque mois",
    },
    {
      key: "utilisateurs",
      label: "Utilisateurs actifs",
      icon: Users,
      used: usage.utilisateurs,
      limit: quota.utilisateurs,
      accent: "text-info",
      hint: "Membres de l'équipe",
    },
    {
      key: "biens",
      label: "Biens gérés",
      icon: Building2,
      used: usage.biens,
      limit: quota.biens,
      accent: "text-warning",
      hint: "Portefeuille immobilier",
    },
    {
      key: "reservations_mois",
      label: "Réservations ce mois",
      icon: CalendarCheck,
      used: usage.reservations_mois,
      limit: quota.reservations_mois,
      accent: "text-success",
      hint: "Nouvelles réservations",
    },
  ];

  return (
    <div className="min-h-screen flex relative overflow-x-hidden">
      <FloatingParticles count={25} />
      <DynamicSidebar onSignOut={handleSignOut} />

      <main className="flex-1 lg:ml-64 mesh-gradient min-h-screen">
        <div className="p-4 lg:p-8">
          <div className="max-w-6xl mx-auto relative z-10">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4 mb-8 premium-header rounded-xl p-4"
            >
              <Button variant="ghost" size="icon" asChild>
                <Link to="/parametres">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
              </Button>
              <div className="flex-1">
                <h1 className="text-3xl font-bold">Mon abonnement</h1>
                <p className="text-muted-foreground">
                  Votre consommation en temps réel et vos quotas de forfait
                </p>
              </div>
              <Link to="/tarifs">
                <Button className="gap-2 rounded-xl">
                  Changer de forfait
                  <ArrowUpRight className="w-4 h-4" />
                </Button>
              </Link>
            </motion.div>

            {/* Trial expired banner */}
            {isExpired && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 rounded-2xl border border-destructive/40 bg-destructive/5 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-destructive/10 border border-destructive/30 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-destructive mb-1">
                    Votre essai gratuit est terminé
                  </h3>
                  <p className="text-sm text-muted-foreground flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    Passez à un forfait payant pour continuer. Toutes vos données
                    sont conservées et réapparaîtront dès le paiement effectué.
                  </p>
                </div>
                <Link to="/tarifs">
                  <Button className="rounded-xl">Choisir un forfait</Button>
                </Link>
              </motion.div>
            )}

            {/* Current Plan Card */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="relative rounded-2xl border border-primary/30 bg-gradient-to-br from-card via-card/80 to-background overflow-hidden mb-6"
            >
              <div className="absolute -top-24 -right-24 w-72 h-72 bg-primary/20 blur-[100px] rounded-full pointer-events-none" />
              <div className="relative p-6 lg:p-8 flex flex-col lg:flex-row lg:items-center gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center">
                    <PlanIcon className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Forfait actuel</div>
                    <div className="text-2xl font-bold">{planLabel}</div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {isExpired ? (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="w-3 h-3" /> Expiré
                        </Badge>
                      ) : isTrial ? (
                        <Badge className="bg-primary/15 text-primary border border-primary/30 gap-1">
                          <Sparkles className="w-3 h-3" /> Essai — {trialDaysLeft} j restant{trialDaysLeft > 1 ? "s" : ""}
                        </Badge>
                      ) : (
                        <Badge className="bg-primary/15 text-primary border border-primary/30 gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Actif
                        </Badge>
                      )}
                      {!isTrial && planData && (
                        <span className="text-xs text-muted-foreground">
                          {billingCycle === "yearly" ? "Facturation annuelle" : "Facturation mensuelle"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="lg:ml-auto grid grid-cols-2 gap-6 text-sm">
                  {planData && !isTrial && (
                    <div>
                      <div className="text-muted-foreground text-xs">Montant</div>
                      <div className="font-semibold text-base">
                        {formatGNF(
                          billingCycle === "yearly"
                            ? planData.priceYearly
                            : planData.priceMonthly,
                        )}
                        <span className="text-xs text-muted-foreground font-normal">
                          {" "}/ {billingCycle === "yearly" ? "an" : "mois"}
                        </span>
                      </div>
                    </div>
                  )}
                  {trialEndsAt && isTrial && (
                    <div>
                      <div className="text-muted-foreground text-xs flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Fin de l'essai
                      </div>
                      <div className="font-semibold text-base">
                        {trialEndsAt.toLocaleDateString("fr-FR")}
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="text-muted-foreground text-xs">Statut</div>
                    <div className="font-semibold text-base capitalize">{status}</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Quota Usage Grid */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    Utilisation de votre forfait
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Suivez votre consommation actuelle par rapport à vos limites
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {quotaItems.map((item, idx) => {
                  const unlimited = item.limit === null;
                  const pct = unlimited
                    ? 0
                    : Math.min(100, Math.round((item.used / (item.limit || 1)) * 100));
                  const warning = !unlimited && pct >= 80 && pct < 100;
                  const full = !unlimited && pct >= 100;
                  const Icon = item.icon;
                  const remaining = unlimited ? null : Math.max(0, (item.limit ?? 0) - item.used);

                  return (
                    <motion.div
                      key={item.key}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.12 + idx * 0.05 }}
                      className={`rounded-2xl border p-5 bg-card/60 backdrop-blur-sm relative overflow-hidden ${
                        full
                          ? "border-destructive/40"
                          : warning
                            ? "border-warning/40"
                            : "border-border/50"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={`p-2 rounded-xl bg-secondary/60 ${item.accent}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        {unlimited ? (
                          <Badge className="bg-primary/15 text-primary border border-primary/30 gap-1">
                            <InfinityIcon className="w-3 h-3" /> Illimité
                          </Badge>
                        ) : full ? (
                          <Badge variant="destructive">Quota atteint</Badge>
                        ) : warning ? (
                          <Badge className="bg-warning/15 text-warning border border-warning/30">
                            Bientôt atteint
                          </Badge>
                        ) : (
                          <span className="text-xs font-mono text-muted-foreground">
                            {pct}%
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-muted-foreground mb-1">
                        {item.label}
                      </div>
                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-2xl font-bold">{item.used}</span>
                        <span className="text-sm text-muted-foreground">
                          {unlimited ? "utilisés" : `/ ${item.limit}`}
                        </span>
                      </div>

                      {!unlimited && (
                        <>
                          <Progress
                            value={pct}
                            className={`h-2 ${
                              full
                                ? "[&>div]:bg-destructive"
                                : warning
                                  ? "[&>div]:bg-warning"
                                  : ""
                            }`}
                          />
                          <div className="flex items-center justify-between mt-2 text-[11px] text-muted-foreground">
                            <span>{item.hint}</span>
                            <span className="font-mono">
                              {remaining} restant{(remaining ?? 0) > 1 ? "s" : ""}
                            </span>
                          </div>
                        </>
                      )}
                      {unlimited && (
                        <div className="text-[11px] text-muted-foreground">
                          {item.hint} · Aucune limite
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Weekly activity chart */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-5 mb-6"
            >
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div>
                  <h2 className="text-lg font-bold">Activité hebdomadaire</h2>
                  <p className="text-sm text-muted-foreground">
                    Factures et réservations créées sur les 4 dernières semaines
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-primary" /> Factures
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-info" /> Réservations
                  </span>
                </div>
              </div>
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeks} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                    />
                    <Legend wrapperStyle={{ display: "none" }} />
                    <Bar dataKey="factures" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="reservations" fill="hsl(var(--info))" radius={[6, 6, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Plan features reminder */}
            {planData && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-6"
              >
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  Inclus dans votre forfait {planData.name}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {planData.features.map((f) => (
                    <div key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Abonnement;
