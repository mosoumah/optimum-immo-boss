import { useEffect, useState, useCallback, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
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
  Smartphone,
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
import { Activity } from "lucide-react";
import { FloatingParticles } from "@/components/FloatingParticles";
import { DynamicSidebar } from "@/components/DynamicSidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEntreprise } from "@/hooks/useEntreprise";
import { useSubscription } from "@/hooks/useSubscription";
import { useUserRole } from "@/hooks/useUserRole";
import { usePlans, toCycleParam, fromCycleParam } from "@/hooks/usePlans";
import { BillingToggle } from "@/components/pricing/BillingToggle";
import { PLANS, formatGNF, type PlanId } from "@/lib/pricing/plans";
import {
  addDaysGN,
  formatDateGN,
  formatDayMonthGN,
  monthBoundsGN,
  startOfDayGN,
  startOfWeekGN,
  toDateOnly,
} from "@/lib/dateGuinee";
import {
  subscriptionPaymentsTable,
  type CheckoutCreateResponse,
  type CheckoutSyncResponse,
  type SubscriptionPaymentRow,
} from "@/types/billing";

/**
 * Extrait le message d'erreur reel d'une Edge Function.
 * Un statut non-2xx donne une FunctionsHttpError dont le message est generique :
 * le corps JSON { error } porte le vrai motif.
 */
const readFunctionError = async (error: unknown, fallback: string): Promise<string> => {
  const context = (error as { context?: { json?: () => Promise<unknown> } } | null)?.context;
  if (context && typeof context.json === "function") {
    try {
      const body = (await context.json()) as { error?: string } | null;
      if (body?.error) return body.error;
    } catch {
      // Corps illisible : on garde le message de repli.
    }
  }
  return error instanceof Error && error.message ? error.message : fallback;
};

const PLAN_ICON: Record<string, typeof Rocket> = {
  trial: Sparkles,
  starter: Rocket,
  standard: Crown,
  pro: Gem,
};

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  pending: "En attente",
  success: "Réussi",
  failed: "Échoué",
  cancelled: "Annulé",
};

const PAYMENT_STATUS_STYLE: Record<string, string> = {
  pending: "border-warning/40 bg-warning/10 text-warning",
  success: "border-success/40 bg-success/10 text-success",
  failed: "border-destructive/40 bg-destructive/10 text-destructive",
  cancelled: "border-border/50 bg-muted/20 text-muted-foreground",
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

const Abonnement = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { entrepriseId, isLoading: entrepriseLoading } = useEntreprise();
  const { isAdmin } = useUserRole();
  const {
    plan,
    status,
    isTrial,
    trialDaysLeft,
    trialEndsAt,
    billingCycle,
    isExpired,
    isLoading: subLoading,
    refetch: refetchSubscription,
  } = useSubscription();

  const [weeks, setWeeks] = useState<WeekPoint[]>([]);
  const [usage, setUsage] = useState<UsageCounts>({
    factures_mois: 0,
    utilisateurs: 0,
    biens: 0,
    reservations_mois: 0,
  });
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [payments, setPayments] = useState<SubscriptionPaymentRow[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const { plans: dbPlans } = usePlans();

  // Cycle affiché : initialisé depuis ?cycle= de l'URL (retour de la page Tarifs).
  const [cycle, setCycle] = useState<"monthly" | "yearly">(() =>
    fromCycleParam(searchParams.get("cycle")),
  );

  // Formule à mettre en évidence depuis ?plan= (aucun paiement automatique).
  const highlightedPlan = searchParams.get("plan");

  // Historique des paiements — lecture seule, reservee a l'admin, 20 dernieres.
  useEffect(() => {
    if (!isAdmin || !entrepriseId) return;
    let active = true;

    (async () => {
      setPaymentsLoading(true);
      try {
        const { data, error } = await subscriptionPaymentsTable()
          .select(
            "id, entreprise_id, plan, montant, devise, statut, billing_cycle, paid_at, created_at",
          )
          .eq("entreprise_id", entrepriseId)
          .order("created_at", { ascending: false })
          .limit(20);
        if (error) throw error;
        if (active) setPayments(data ?? []);
      } catch {
        if (active) setPayments([]);
      } finally {
        if (active) setPaymentsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [isAdmin, entrepriseId]);
  // Retour SasPay : 'checking' | 'failed' | 'timeout' | null
  const [paymentSync, setPaymentSync] = useState<"checking" | "failed" | "timeout" | null>(null);
  const [syncAttempt, setSyncAttempt] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncInFlight = useRef(false);

  /** Retire ?paiement de l'URL sans recharger la page. */
  const clearPaymentParam = useCallback(() => {
    const next = new URLSearchParams(window.location.search);
    next.delete("paiement");
    const query = next.toString();
    window.history.replaceState(
      {},
      "",
      window.location.pathname + (query ? `?${query}` : ""),
    );
  }, []);

  /**
   * Verifie l'etat du paiement aupres de saspay-checkout (action "sync").
   * Aucun identifiant n'est transmis : la fonction se base sur l'utilisateur connecte.
   * Renvoie le statut, ou null si l'appel a echoue.
   */
  const runPaymentSync = async (): Promise<"success" | "pending" | "failed" | "cancelled" | "none" | null> => {
    if (syncInFlight.current) return null;
    syncInFlight.current = true;
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("saspay-checkout", {
        body: { action: "sync" },
      });
      if (error) {
        toast({
          title: "Vérification impossible",
          description: await readFunctionError(error, "Le service de paiement est indisponible."),
          variant: "destructive",
        });
        return null;
      }
      return (data as CheckoutSyncResponse | null)?.status ?? "none";
    } catch (err) {
      toast({
        title: "Vérification impossible",
        description: await readFunctionError(err, "Erreur réseau pendant la vérification."),
        variant: "destructive",
      });
      return null;
    } finally {
      syncInFlight.current = false;
      setIsSyncing(false);
    }
  };

  // Retour de paiement SasPay : ?paiement=retour -> polling /sync toutes les 4 s, 30 fois max.
  useEffect(() => {
    if (searchParams.get("paiement") !== "retour") return;
    if (!entrepriseId) return;

    let cancelled = false;

    const poll = async () => {
      if (cancelled) return;
      setSyncAttempt((n) => n + 1);

      const status = await runPaymentSync();
      if (cancelled) return;

      if (status === "success") {
        await refetchSubscription();
        if (cancelled) return;
        toast({
          title: "Paiement confirmé",
          description: "Votre abonnement a été activé avec succès.",
        });
        setPaymentSync(null);
        setSyncAttempt(0);
        clearPaymentParam();
        return;
      }

      if (status === "failed" || status === "cancelled") {
        toast({
          title: status === "failed" ? "Échec du paiement" : "Paiement annulé",
          description:
            status === "failed"
              ? "Le paiement n'a pas abouti. Votre abonnement reste inchangé."
              : "Vous avez annulé le paiement. Vous pouvez réessayer.",
          variant: "destructive",
        });
        setPaymentSync("failed");
        return;
      }

      // 'pending' | 'none' | echec d'appel : on poursuit jusqu'a 30 tentatives.
      setSyncAttempt((n) => {
        if (n >= 30) {
          setPaymentSync("timeout");
          clearPaymentParam();
          return n;
        }
        window.setTimeout(poll, 4000);
        return n;
      });
    };

    setPaymentSync("checking");
    setSyncAttempt(0);
    poll();

    return () => {
      cancelled = true;
    };
  }, [entrepriseId, clearPaymentParam, refetchSubscription, searchParams]);

  /**
   * Demarre un paiement SasPay. Aucun montant n'est transmis : la fonction
   * serveur le determine depuis le code de formule et le cycle.
   */
  const handleChoosePlan = async (code: string) => {
    if (purchasing) return;
    setPurchasing(code);
    try {
      const { data, error } = await supabase.functions.invoke("saspay-checkout", {
        body: { action: "create", plan: code, cycle: toCycleParam(cycle) },
      });
      if (error) {
        toast({
          title: "Paiement impossible",
          description: await readFunctionError(error, "Le service de paiement est indisponible."),
          variant: "destructive",
        });
        return;
      }

      const url = (data as CheckoutCreateResponse | null)?.checkout_url;
      if (!url) {
        toast({
          title: "Paiement impossible",
          description: "Aucune page de paiement renvoyée par le serveur.",
          variant: "destructive",
        });
        return;
      }

      window.location.href = url;
    } catch (err) {
      toast({
        title: "Paiement impossible",
        description: await readFunctionError(err, "Erreur inattendue lors de l'initialisation du paiement."),
        variant: "destructive",
      });
    } finally {
      setPurchasing(null);
    }
  };

  // Retour paiement — succès / annulation
  useEffect(() => {
    const result = searchParams.get("checkout");
    if (!result) return;
    if (result === "success") {
      toast({
        title: "🎉 Paiement confirmé",
        description: "Votre abonnement est en cours d'activation. Cette page se met à jour automatiquement.",
      });
      // Poll refetch pendant 20s au cas où le webhook n'aurait pas encore terminé
      let tries = 0;
      const iv = setInterval(async () => {
        tries++;
        await refetchSubscription();
        if (tries >= 10) clearInterval(iv);
      }, 2000);
    } else if (result === "cancel" || result === "cancelled") {
      toast({
        title: "Paiement annulé",
        description: "Votre paiement a été annulé. Vous pouvez réessayer à tout moment.",
        variant: "destructive",
      });
    } else if (result === "failed") {
      toast({
        title: "Échec du paiement",
        description: "Le paiement n'a pas abouti. Votre abonnement actuel reste inchangé.",
        variant: "destructive",
      });
    }
    searchParams.delete("checkout");
    setSearchParams(searchParams, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const fetchData = useCallback(async () => {
    if (!entrepriseId) return;
    setLoading(true);

    const currentWeekStart = startOfWeekGN(); // lundi du jour guinéen courant
    const weekStarts: string[] = [];
    for (let i = 3; i >= 0; i--) {
      weekStarts.push(addDaysGN(currentWeekStart, -i * 7));
    }
    const rangeStart = startOfDayGN(weekStarts[0]) ?? "";
    const rangeEnd = startOfDayGN(addDaysGN(currentWeekStart, 7)) ?? "";

    // Bornes du mois guinéen courant pour les compteurs de quota.
    const monthStart = startOfDayGN(monthBoundsGN().start) ?? "";

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
        .gte("created_at", rangeStart)
        .lt("created_at", rangeEnd),
      supabase
        .from("reservations")
        .select("created_at")
        .eq("entreprise_id", entrepriseId)
        .gte("created_at", rangeStart)
        .lt("created_at", rangeEnd),
      supabase
        .from("factures")
        .select("id", { count: "exact", head: true })
        .eq("entreprise_id", entrepriseId)
        .gte("created_at", monthStart),
      supabase
        .from("reservations")
        .select("id", { count: "exact", head: true })
        .eq("entreprise_id", entrepriseId)
        .gte("created_at", monthStart),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("entreprise_id", entrepriseId),
      supabase
        .from("properties")
        .select("id", { count: "exact", head: true })
        .eq("entreprise_id", entrepriseId),
    ]);

    const bucket = (createdAt: string) => {
      const day = toDateOnly(createdAt);
      if (!day) return -1;
      for (let i = weekStarts.length - 1; i >= 0; i--) {
        if (day >= weekStarts[i]) return i;
      }
      return -1;
    };

    const points: WeekPoint[] = weekStarts.map((ws, i) => ({
      label: i === weekStarts.length - 1 ? "Cette sem." : formatDayMonthGN(ws),
      factures: 0,
      reservations: 0,
    }));

    (facturesWeekRes.data ?? []).forEach((r) => {
      const idx = bucket(r.created_at);
      if (idx >= 0) points[idx].factures += 1;
    });
    (reservationsWeekRes.data ?? []).forEach((r) => {
      const idx = bucket(r.created_at);
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

  // Realtime: refresh usage & weekly chart when underlying data changes
  useEffect(() => {
    if (!entrepriseId) return;
    const channel = supabase
      .channel(`abonnement-usage-${entrepriseId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "factures", filter: `entreprise_id=eq.${entrepriseId}` }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations", filter: `entreprise_id=eq.${entrepriseId}` }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "properties", filter: `entreprise_id=eq.${entrepriseId}` }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles", filter: `entreprise_id=eq.${entrepriseId}` }, () => fetchData())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [entrepriseId, fetchData]);

  if (entrepriseLoading || subLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const PlanIcon = PLAN_ICON[plan] ?? Sparkles;
  const planLabel = PLAN_LABEL[plan] ?? plan;

  // Référentiel DB indexé par code (vide si la table est indisponible).
  const plansByCode = new Map(dbPlans.map((p) => [p.code, p]));

  // Formule mise en avant : celle venue de ?plan= (choix en cours), sinon la
  // formule active. Permet d'afficher les limites de la formule choisie.
  const displayCode =
    highlightedPlan && plansByCode.has(highlightedPlan) ? highlightedPlan : plan;

  const fallbackPlanData = PLANS.find((p) => p.id === (displayCode as PlanId));
  const dbPlan = plansByCode.get(displayCode);
  const fallbackQuota = PLAN_QUOTAS[displayCode] ?? PLAN_QUOTAS.trial;

  // Prix et nom : base si disponible, sinon constantes locales.
  // Le prix annuel vient de plans.prix_annuel_gnf (calculé par la base), jamais d'un x10 local.
  const planData = dbPlan
    ? {
        name: dbPlan.nom,
        priceMonthly: dbPlan.monthly,
        priceYearly: dbPlan.annual,
      }
    : fallbackPlanData;

  // Limites : base si disponible (NULL = illimité), sinon constantes locales.
  const quota: PlanQuota = {
    factures_mois: dbPlan ? dbPlan.maxFacturesParMois : fallbackQuota.factures_mois,
    utilisateurs: dbPlan ? dbPlan.maxUtilisateurs : fallbackQuota.utilisateurs,
    biens: fallbackQuota.biens,
    reservations_mois: fallbackQuota.reservations_mois,
  };

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

            {/* Retour de paiement SasPay */}
            {(paymentSync === "checking" || paymentSync === "failed") && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-6 rounded-2xl border p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 ${
                  paymentSync === "failed"
                    ? "border-destructive/40 bg-destructive/5"
                    : "border-primary/30 bg-primary/5"
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                  {paymentSync === "failed" ? (
                    <AlertTriangle className="w-6 h-6 text-destructive" />
                  ) : (
                    <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold mb-1">
                    {paymentSync === "failed"
                      ? "Le paiement n'a pas abouti"
                      : "Vérification du paiement..."}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {paymentSync === "failed"
                      ? "Votre abonnement reste inchangé. Vous pouvez relancer un paiement depuis les formules ci-dessous."
                      : `Nous confirmons votre paiement auprès de SasPay (tentative ${syncAttempt}/30).`}
                  </p>
                </div>
                {paymentSync === "failed" && (
                  <Button
                    type="button"
                    className="rounded-xl gap-2"
                    disabled={isSyncing}
                    onClick={async () => {
                      setSyncAttempt(0);
                      setPaymentSync("checking");
                      const status = await runPaymentSync();
                      if (status === "success") {
                        toast({
                          title: "Paiement confirmé",
                          description: "Votre abonnement a été activé avec succès.",
                        });
                        await refetchSubscription();
                        setPaymentSync(null);
                        clearPaymentParam();
                      } else if (status === "failed" || status === "cancelled") {
                        setPaymentSync("failed");
                      } else {
                        setPaymentSync("checking");
                        setSyncAttempt(1);
                        window.setTimeout(async () => {
                          const retry = await runPaymentSync();
                          if (retry === "success") {
                            toast({
                              title: "Paiement confirmé",
                              description: "Votre abonnement a été activé avec succès.",
                            });
                            await refetchSubscription();
                            setPaymentSync(null);
                            clearPaymentParam();
                          } else if (retry === "failed" || retry === "cancelled") {
                            setPaymentSync("failed");
                          } else {
                            setPaymentSync("timeout");
                            clearPaymentParam();
                          }
                        }, 4000);
                      }
                    }}
                  >
                    {isSyncing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Vérification...
                      </>
                    ) : (
                      <>
                        Réessayer
                        <ArrowUpRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                )}
              </motion.div>
            )}

            {/* Paiement en attente de confirmation après 30 tentatives */}
            {paymentSync === "timeout" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 rounded-2xl border border-warning/40 bg-warning/5 p-5 flex items-start gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-warning/10 border border-warning/30 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <h3 className="font-bold mb-1">
                    Paiement en cours de confirmation
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Votre paiement est en cours de confirmation, revenez dans quelques
                    minutes. Votre abonnement se mettra à jour automatiquement.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Choix de formule — achat SasPay, reserve a l'admin */}
            {dbPlans.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.03 }}
                className="mb-6"
              >
                <div className="flex justify-center mb-5">
                  <BillingToggle value={cycle} onChange={setCycle} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {dbPlans.map((dbPlan) => {
                    const PlanCardIcon = PLAN_ICON[dbPlan.code] ?? Sparkles;
                    const isCurrent = plan === dbPlan.code;
                    const isHighlighted = highlightedPlan === dbPlan.code;
                    const canChoose = isAdmin && !isCurrent;

                    return (
                      <div
                        key={dbPlan.code}
                        className={`rounded-2xl border p-5 backdrop-blur-sm transition-all ${
                          isCurrent
                            ? "border-primary/50 bg-primary/5"
                            : isHighlighted
                              ? "border-primary/60 bg-primary/[0.07] ring-2 ring-primary/30"
                              : "border-border/50 bg-card/60"
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
                            <PlanCardIcon className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="font-bold">{dbPlan.nom}</div>
                            {isCurrent && (
                              <div className="text-xs text-primary">Forfait actuel</div>
                            )}
                            {isHighlighted && !isCurrent && (
                              <div className="text-xs text-primary">Formule sélectionnée</div>
                            )}
                          </div>
                        </div>

                        <div className="mb-4">
                          <span className="text-2xl font-bold">
                            {formatGNF(cycle === "yearly" ? dbPlan.annual : dbPlan.monthly)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {" "}/ {cycle === "yearly" ? "an" : "mois"}
                          </span>
                          {cycle === "yearly" && (
                            <div className="text-xs font-semibold text-primary mt-1">
                              2 mois offerts
                            </div>
                          )}
                        </div>

                        <div className="text-xs text-muted-foreground mb-4">
                          {dbPlan.maxUtilisateurs ?? "Illimité"} utilisateur
                          {dbPlan.maxUtilisateurs === 1 ? "" : "s"} ·{" "}
                          {dbPlan.maxFacturesParMois ?? "Illimité"} facture
                          {dbPlan.maxFacturesParMois === 1 ? "" : "s"} / mois
                        </div>

                        {canChoose && (
                          <Button
                            type="button"
                            className="w-full rounded-xl gap-2"
                            disabled={purchasing !== null}
                            onClick={() => handleChoosePlan(dbPlan.code)}
                          >
                            {purchasing === dbPlan.code ? (
                              <>
                                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                Redirection...
                              </>
                            ) : (
                              <>
                                Choisir {dbPlan.nom}
                                <ArrowUpRight className="w-4 h-4" />
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

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
                      ) : status === "payment_failed" ? (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="w-3 h-3" /> Paiement échoué
                        </Badge>
                      ) : status === "pending_payment" ? (
                        <Badge className="bg-warning/15 text-warning border border-warning/30 gap-1">
                          <Sparkles className="w-3 h-3" /> Paiement en attente
                        </Badge>
                      ) : status === "cancelled" ? (
                        <Badge className="bg-muted text-muted-foreground border border-border gap-1">
                          Annulé
                        </Badge>
                      ) : isTrial ? (
                        <Badge className="bg-primary/15 text-primary border border-primary/30 gap-1">
                          <Sparkles className="w-3 h-3" /> Essai — {trialDaysLeft} j restant{trialDaysLeft > 1 ? "s" : ""}
                        </Badge>
                      ) : (
                        <Badge className="bg-success/15 text-success border border-success/30 gap-1">
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
                        {formatDateGN(trialEndsAt)}
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

            {/* Weekly activity chart — premium */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative rounded-3xl border border-primary/25 bg-gradient-to-br from-card via-card/85 to-background/60 backdrop-blur-xl p-6 lg:p-7 mb-6 overflow-hidden shadow-[0_10px_40px_-15px_hsl(var(--primary)/0.35)]"
            >
              {/* Ambient glow */}
              <div className="absolute -top-32 -right-32 w-80 h-80 bg-primary/25 blur-[110px] rounded-full pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-info/15 blur-[100px] rounded-full pointer-events-none" />

              <div className="relative">
                <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary/25 to-primary/5 border border-primary/30 flex items-center justify-center shadow-inner">
                      <Activity className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-lg lg:text-xl font-bold tracking-tight flex items-center gap-2">
                        Activité hebdomadaire
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      </h2>
                      <p className="text-xs lg:text-sm text-muted-foreground">
                        Factures et réservations créées sur les 4 dernières semaines
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary font-medium">
                      <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
                      Factures
                    </span>
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-info/10 border border-info/25 text-info font-medium">
                      <span className="w-2 h-2 rounded-full bg-info shadow-[0_0_8px_hsl(var(--info))]" />
                      Réservations
                    </span>
                  </div>
                </div>

                {/* Summary stats — basé sur les données réelles */}
                {(() => {
                  const totalF = weeks.reduce((s, w) => s + w.factures, 0);
                  const totalR = weeks.reduce((s, w) => s + w.reservations, 0);
                  const avgF = weeks.length ? (totalF / weeks.length).toFixed(1) : "0";
                  const avgR = weeks.length ? (totalR / weeks.length).toFixed(1) : "0";
                  const last = weeks[weeks.length - 1];
                  const prev = weeks[weeks.length - 2];
                  const lastF = last?.factures ?? 0;
                  const prevF = prev?.factures ?? 0;
                  const deltaF = prevF === 0 ? (lastF > 0 ? 100 : 0) : Math.round(((lastF - prevF) / prevF) * 100);
                  const stats = [
                    { label: "Total factures (4 sem.)", value: totalF, tone: "text-primary", bg: "from-primary/15 to-primary/0" },
                    { label: "Total réservations (4 sem.)", value: totalR, tone: "text-info", bg: "from-info/15 to-info/0" },
                    { label: "Moyenne factures/sem.", value: avgF, sub: `${avgR} résa/sem.`, tone: "text-foreground", bg: "from-muted/40 to-muted/0" },
                  ];
                  void deltaF;
                  return (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 mb-6">
                      {stats.map((s) => (
                        <div
                          key={s.label}
                          className={`relative rounded-xl border border-border/40 bg-gradient-to-br ${s.bg} px-3.5 py-2.5 overflow-hidden`}
                        >
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                            {s.label}
                          </div>
                        <div className={`text-xl font-bold mt-0.5 ${s.tone}`}>
                          {s.value}
                        </div>

                          {s.sub && (
                            <div className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })()}

                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={weeks} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradFactures" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.55} />
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="gradReservations" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--info))" stopOpacity={0.9} />
                          <stop offset="100%" stopColor="hsl(var(--info))" stopOpacity={0.5} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 6" stroke="hsl(var(--border))" opacity={0.25} vertical={false} />
                      <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 500 }}
                        dy={6}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                        allowDecimals={false}
                        width={32}
                      />
                      <Tooltip
                        cursor={{ fill: "hsl(var(--primary) / 0.06)", radius: 8 }}
                        contentStyle={{
                          background: "hsl(var(--card) / 0.95)",
                          backdropFilter: "blur(12px)",
                          border: "1px solid hsl(var(--primary) / 0.3)",
                          borderRadius: 14,
                          fontSize: 12,
                          boxShadow: "0 10px 30px -10px hsl(var(--primary) / 0.4)",
                        }}
                        labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="factures"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2.5}
                        fill="url(#gradFactures)"
                        dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "hsl(var(--background))" }}
                        activeDot={{ r: 6, strokeWidth: 2, stroke: "hsl(var(--background))" }}
                        name="Factures"
                      />
                      <Bar
                        dataKey="reservations"
                        fill="url(#gradReservations)"
                        radius={[8, 8, 0, 0]}
                        maxBarSize={34}
                        name="Réservations"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>


            {/* Plan features reminder */}
            {planData && fallbackPlanData && (
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
                  {fallbackPlanData.features.map((f) => (
                    <div key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Historique des paiements — admin, lecture seule */}
            {isAdmin && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-6 rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-6"
              >
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-primary" />
                  Historique des paiements
                </h3>

                {paymentsLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                    <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    Chargement...
                  </div>
                ) : payments.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">
                    Aucun paiement enregistré pour le moment.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-muted-foreground border-b border-border/50">
                          <th className="pb-2 pr-4 font-medium">Formule</th>
                          <th className="pb-2 pr-4 font-medium">Période</th>
                          <th className="pb-2 pr-4 font-medium">Montant</th>
                          <th className="pb-2 pr-4 font-medium">Statut</th>
                          <th className="pb-2 font-medium">Payé le</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((p) => (
                          <tr key={p.id} className="border-b border-border/30 last:border-0">
                            <td className="py-2.5 pr-4 font-medium capitalize">
                              {PLAN_LABEL[p.plan] ?? p.plan}
                            </td>
                            <td className="py-2.5 pr-4 text-muted-foreground">
                              {p.billing_cycle === "annual" ? "Annuel" : "Mensuel"}
                            </td>
                            <td className="py-2.5 pr-4">
                              {formatGNF(Number(p.montant))}
                              <span className="text-muted-foreground"> {p.devise}</span>
                            </td>
                            <td className="py-2.5 pr-4">
                              <span
                                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${
                                  PAYMENT_STATUS_STYLE[p.statut] ??
                                  "border-border/50 text-muted-foreground"
                                }`}
                              >
                                {PAYMENT_STATUS_LABEL[p.statut] ?? p.statut}
                              </span>
                            </td>
                            <td className="py-2.5 text-muted-foreground">
                              {p.paid_at
                                ? formatDateGN(p.paid_at)
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            )}

            {/* Moyens de paiement */}
            <div className="mt-6 text-center">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4 font-semibold">
                Moyen de paiement accepté
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-500 text-sm font-semibold">
                <Smartphone className="w-4 h-4" />
                MTN Mobile Money
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Vous n'avez pas de compte Mobile Money ? Contactez-nous.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Abonnement;
