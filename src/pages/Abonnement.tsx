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
  Users,
  Receipt,
  Building,
  CalendarCheck,
  Infinity as InfinityIcon,
} from "lucide-react";
import { FloatingParticles } from "@/components/FloatingParticles";
import { DynamicSidebar } from "@/components/DynamicSidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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

interface PlanLimits {
  users: number | null; // null = illimité
  factures: number | null;
}

const PLAN_LIMITS: Record<PlanId | "trial", PlanLimits> = {
  trial: { users: null, factures: null },
  starter: { users: 2, factures: 100 },
  standard: { users: 5, factures: 500 },
  pro: { users: null, factures: null },
};

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

interface Usage {
  users: number;
  facturesMois: number;
  biens: number;
  reservationsMois: number;
  clients: number;
}

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

  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const fetchUsage = useCallback(async () => {
    if (!entrepriseId) return;
    setLoading(true);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const iso = startOfMonth.toISOString();

    const [usersRes, facturesRes, biensRes, reservationsRes, clientsRes] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("entreprise_id", entrepriseId),
        supabase
          .from("factures")
          .select("id", { count: "exact", head: true })
          .eq("entreprise_id", entrepriseId)
          .gte("created_at", iso),
        supabase
          .from("properties")
          .select("id", { count: "exact", head: true })
          .eq("entreprise_id", entrepriseId),
        supabase
          .from("reservations")
          .select("id", { count: "exact", head: true })
          .eq("entreprise_id", entrepriseId)
          .gte("created_at", iso),
        supabase
          .from("clients")
          .select("id", { count: "exact", head: true })
          .eq("entreprise_id", entrepriseId),
      ]);

    setUsage({
      users: usersRes.count ?? 0,
      facturesMois: facturesRes.count ?? 0,
      biens: biensRes.count ?? 0,
      reservationsMois: reservationsRes.count ?? 0,
      clients: clientsRes.count ?? 0,
    });
    setLoading(false);
  }, [entrepriseId]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  if (entrepriseLoading || subLoading || loading || !usage) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const limits = PLAN_LIMITS[(plan as PlanId) ?? "trial"] ?? PLAN_LIMITS.trial;
  const PlanIcon = PLAN_ICON[plan] ?? Sparkles;
  const planLabel = PLAN_LABEL[plan] ?? plan;
  const planData = PLANS.find((p) => p.id === plan);

  const formatQuota = (used: number, limit: number | null) =>
    limit === null ? `${used} / ∞` : `${used} / ${limit}`;

  const percent = (used: number, limit: number | null) =>
    limit === null ? 0 : Math.min(100, Math.round((used / limit) * 100));

  const rows = [
    {
      icon: Users,
      label: "Utilisateurs actifs",
      used: usage.users,
      limit: limits.users,
      period: "Total",
    },
    {
      icon: Receipt,
      label: "Factures ce mois-ci",
      used: usage.facturesMois,
      limit: limits.factures,
      period: "Mensuel",
    },
    {
      icon: Building,
      label: "Biens gérés",
      used: usage.biens,
      limit: null,
      period: "Illimité",
    },
    {
      icon: CalendarCheck,
      label: "Réservations ce mois-ci",
      used: usage.reservationsMois,
      limit: null,
      period: "Illimité",
    },
    {
      icon: Users,
      label: "Clients enregistrés",
      used: usage.clients,
      limit: null,
      period: "Illimité",
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
                  Suivez votre forfait et votre consommation en temps réel
                </p>
              </div>
              <Link to="/tarifs">
                <Button className="gap-2 rounded-xl">
                  Changer de forfait
                  <ArrowUpRight className="w-4 h-4" />
                </Button>
              </Link>
            </motion.div>

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
                    <div className="flex items-center gap-2 mt-1">
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

            {/* Usage Table */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-border/50 premium-card overflow-hidden"
            >
              <div className="p-5 border-b border-border/50 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">Consommation en temps réel</h2>
                  <p className="text-sm text-muted-foreground">
                    Aperçu de votre usage par rapport aux limites de votre forfait
                  </p>
                </div>
                <Badge variant="outline" className="hidden sm:inline-flex">
                  Mis à jour à l'instant
                </Badge>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ressource</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead>Utilisé / Limite</TableHead>
                    <TableHead className="w-[35%]">Progression</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => {
                    const p = percent(r.used, r.limit);
                    const over = r.limit !== null && r.used >= r.limit;
                    const warn = r.limit !== null && p >= 80 && !over;
                    return (
                      <TableRow key={r.label}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                              <r.icon className="w-4 h-4 text-primary" />
                            </div>
                            <span className="font-medium">{r.label}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">{r.period}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm inline-flex items-center gap-1">
                            {r.limit === null ? (
                              <>
                                {r.used} <InfinityIcon className="w-3.5 h-3.5 text-primary" />
                              </>
                            ) : (
                              formatQuota(r.used, r.limit)
                            )}
                          </span>
                        </TableCell>
                        <TableCell>
                          {r.limit === null ? (
                            <div className="text-xs text-muted-foreground italic">Illimité</div>
                          ) : (
                            <div className="space-y-1">
                              <Progress
                                value={p}
                                className={
                                  over
                                    ? "[&>div]:bg-destructive"
                                    : warn
                                      ? "[&>div]:bg-amber-500"
                                      : ""
                                }
                              />
                              <div
                                className={`text-xs ${
                                  over
                                    ? "text-destructive"
                                    : warn
                                      ? "text-amber-500"
                                      : "text-muted-foreground"
                                }`}
                              >
                                {p}% utilisé
                                {over && " — limite atteinte"}
                                {warn && " — proche de la limite"}
                              </div>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
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
