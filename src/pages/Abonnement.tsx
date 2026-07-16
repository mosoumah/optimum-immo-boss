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
  CalendarCheck,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
} from "lucide-react";
import { FloatingParticles } from "@/components/FloatingParticles";
import { DynamicSidebar } from "@/components/DynamicSidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

interface WeekRow {
  label: string;
  range: string;
  factures: number;
  reservations: number;
  revenus: number;
  depenses: number;
  isCurrent: boolean;
}

const startOfWeek = (d: Date) => {
  const day = d.getDay();
  const diff = (day + 6) % 7; // Monday as first day
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

  const [weeks, setWeeks] = useState<WeekRow[]>([]);
  const [loading, setLoading] = useState(true);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const fetchWeeks = useCallback(async () => {
    if (!entrepriseId) return;
    setLoading(true);

    const now = new Date();
    const currentWeekStart = startOfWeek(now);
    // 4 weeks: this week + 3 previous
    const weekStarts: Date[] = [];
    for (let i = 3; i >= 0; i--) {
      const d = new Date(currentWeekStart);
      d.setDate(d.getDate() - i * 7);
      weekStarts.push(d);
    }
    const rangeStart = weekStarts[0];
    const rangeEnd = new Date(currentWeekStart);
    rangeEnd.setDate(rangeEnd.getDate() + 7);

    const isoStart = rangeStart.toISOString();
    const isoEnd = rangeEnd.toISOString();

    const [facturesRes, reservationsRes, revenusRes, depensesRes] =
      await Promise.all([
        supabase
          .from("factures")
          .select("created_at")
          .eq("entreprise_id", entrepriseId)
          .gte("created_at", isoStart)
          .lt("created_at", isoEnd),
        supabase
          .from("reservations")
          .select("created_at")
          .eq("entreprise_id", entrepriseId)
          .gte("created_at", isoStart)
          .lt("created_at", isoEnd),
        supabase
          .from("revenus")
          .select("date,montant")
          .eq("entreprise_id", entrepriseId)
          .gte("date", rangeStart.toISOString().slice(0, 10))
          .lt("date", rangeEnd.toISOString().slice(0, 10)),
        supabase
          .from("depenses")
          .select("date,montant")
          .eq("entreprise_id", entrepriseId)
          .gte("date", rangeStart.toISOString().slice(0, 10))
          .lt("date", rangeEnd.toISOString().slice(0, 10)),
      ]);

    const bucket = (d: Date) => {
      for (let i = weekStarts.length - 1; i >= 0; i--) {
        if (d >= weekStarts[i]) return i;
      }
      return -1;
    };

    const rows: WeekRow[] = weekStarts.map((ws, i) => {
      const we = new Date(ws);
      we.setDate(we.getDate() + 6);
      const isCurrent = i === weekStarts.length - 1;
      return {
        label: isCurrent
          ? "Cette semaine"
          : i === weekStarts.length - 2
            ? "Semaine dernière"
            : `Il y a ${weekStarts.length - 1 - i} semaines`,
        range: `${fmtDay(ws)} — ${fmtDay(we)}`,
        factures: 0,
        reservations: 0,
        revenus: 0,
        depenses: 0,
        isCurrent,
      };
    });

    (facturesRes.data ?? []).forEach((r) => {
      const idx = bucket(new Date(r.created_at));
      if (idx >= 0) rows[idx].factures += 1;
    });
    (reservationsRes.data ?? []).forEach((r) => {
      const idx = bucket(new Date(r.created_at));
      if (idx >= 0) rows[idx].reservations += 1;
    });
    (revenusRes.data ?? []).forEach((r) => {
      const idx = bucket(new Date(r.date));
      if (idx >= 0) rows[idx].revenus += Number(r.montant) || 0;
    });
    (depensesRes.data ?? []).forEach((r) => {
      const idx = bucket(new Date(r.date));
      if (idx >= 0) rows[idx].depenses += Number(r.montant) || 0;
    });

    setWeeks(rows);
    setLoading(false);
  }, [entrepriseId]);

  useEffect(() => {
    fetchWeeks();
  }, [fetchWeeks]);

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

  const totals = weeks.reduce(
    (a, w) => ({
      factures: a.factures + w.factures,
      reservations: a.reservations + w.reservations,
      revenus: a.revenus + w.revenus,
      depenses: a.depenses + w.depenses,
    }),
    { factures: 0, reservations: 0, revenus: 0, depenses: 0 },
  );

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
                  Suivez votre forfait et votre consommation hebdomadaire
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

            {/* Weekly Usage Table */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-border/50 premium-card overflow-hidden"
            >
              <div className="p-5 border-b border-border/50 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-lg font-bold">Consommation hebdomadaire</h2>
                  <p className="text-sm text-muted-foreground">
                    Vue détaillée de votre activité sur les 4 dernières semaines
                  </p>
                </div>
                <Badge variant="outline" className="hidden sm:inline-flex">
                  Mis à jour à l'instant
                </Badge>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Semaine</TableHead>
                      <TableHead className="text-center">
                        <span className="inline-flex items-center gap-1.5">
                          <Receipt className="w-3.5 h-3.5" /> Factures
                        </span>
                      </TableHead>
                      <TableHead className="text-center">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarCheck className="w-3.5 h-3.5" /> Réservations
                        </span>
                      </TableHead>
                      <TableHead className="text-right">
                        <span className="inline-flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-primary" /> Revenus
                        </span>
                      </TableHead>
                      <TableHead className="text-right">
                        <span className="inline-flex items-center gap-1.5">
                          <TrendingDown className="w-3.5 h-3.5 text-destructive" /> Dépenses
                        </span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {weeks.map((w) => (
                      <TableRow
                        key={w.range}
                        className={w.isCurrent ? "bg-primary/5" : ""}
                      >
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium flex items-center gap-2">
                              {w.label}
                              {w.isCurrent && (
                                <Badge
                                  variant="outline"
                                  className="border-primary/40 text-primary text-[10px] px-1.5 py-0"
                                >
                                  En cours
                                </Badge>
                              )}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {w.range}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-mono">
                          {w.factures}
                        </TableCell>
                        <TableCell className="text-center font-mono">
                          {w.reservations}
                        </TableCell>
                        <TableCell className="text-right font-mono text-primary">
                          {formatGNF(w.revenus)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-destructive/80">
                          {formatGNF(w.depenses)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/30 font-semibold">
                      <TableCell>Total 4 semaines</TableCell>
                      <TableCell className="text-center font-mono">
                        {totals.factures}
                      </TableCell>
                      <TableCell className="text-center font-mono">
                        {totals.reservations}
                      </TableCell>
                      <TableCell className="text-right font-mono text-primary">
                        {formatGNF(totals.revenus)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-destructive/80">
                        {formatGNF(totals.depenses)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </motion.div>

            {/* Plan features reminder */}
            {planData && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mt-6 rounded-2xl border border-border/50 premium-card p-6"
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
