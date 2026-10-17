import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity,
  Plus,
  Pencil,
  Trash2,
  Users,
  CalendarCheck,
  Receipt,
  TrendingUp,
  TrendingDown,
  CheckSquare,
  Building,
  RefreshCw,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FloatingParticles } from "@/components/FloatingParticles";
import { DynamicSidebar } from "@/components/DynamicSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useEntreprise } from "@/hooks/useEntreprise";
import { formatTimeGN, hourGN, startOfTodayGN } from "@/lib/dateGuinee";
import {
  activityLogTable,
  profileNamesTable,
  type ActivityAction,
  type ActivityDetails,
  type ActivityEntityType,
  type ActivityRow,
} from "@/types/activity";

const AUTO_REFRESH_MS = 30_000;
const LIMIT = 200;

interface EntityMeta {
  label: string;
  icon: typeof Users;
}

const ENTITY_META: Record<ActivityEntityType, EntityMeta> = {
  client: { label: "Clients", icon: Users },
  reservation: { label: "Réservations", icon: CalendarCheck },
  facture: { label: "Factures", icon: Receipt },
  revenu: { label: "Revenus", icon: TrendingUp },
  depense: { label: "Dépenses", icon: TrendingDown },
  tache: { label: "Tâches", icon: CheckSquare },
  bien: { label: "Biens", icon: Building },
};

interface ActionMeta {
  label: string;
  icon: typeof Plus;
  className: string;
}

const ACTION_META: Record<ActivityAction, ActionMeta> = {
  create: {
    label: "Création",
    icon: Plus,
    className: "bg-success/10 text-success border-success/30",
  },
  update: {
    label: "Modification",
    icon: Pencil,
    className: "bg-info/10 text-info border-info/30",
  },
  delete: {
    label: "Suppression",
    icon: Trash2,
    className: "bg-destructive/10 text-destructive border-destructive/30",
  },
};

const FILTERS: { value: ActivityEntityType | "all"; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "client", label: "Clients" },
  { value: "reservation", label: "Réservations" },
  { value: "facture", label: "Factures" },
  { value: "revenu", label: "Revenus" },
  { value: "depense", label: "Dépenses" },
  { value: "tache", label: "Tâches" },
  { value: "bien", label: "Biens" },
];

// Heures affichées et regroupées en heure de Guinée, jamais celle de l'appareil.
const formatTime = (iso: string) => formatTimeGN(iso);

const hourRangeLabel = (hour: number) =>
  `${String(hour).padStart(2, "0")}:00 – ${String(hour).padStart(2, "0")}:59`;

/** "statut : avant → après" si details porte les deux statuts. */
const statusTransition = (details: ActivityDetails | null): string | null => {
  if (!details) return null;
  const before = details.statut_avant;
  const after = details.statut_apres;
  if (!before || !after) return null;
  return `statut : ${before} → ${after}`;
};

const Activite = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { entrepriseId, isLoading: entrepriseLoading } = useEntreprise();

  const [events, setEvents] = useState<ActivityRow[]>([]);
  const [authorNames, setAuthorNames] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ActivityEntityType | "all">("all");

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const fetchActivity = useCallback(async () => {
    if (!entrepriseId) return;
    setIsLoading(true);
    setError(null);

    try {
      // Depuis 00:00 heure de Guinée (instant ISO pour la comparaison).
      const start = startOfTodayGN();

      const { data, error: queryError } = await activityLogTable()
        .select(
          "id, entreprise_id, actor_id, action, entity_type, entity_id, summary, details, created_at",
        )
        .eq("entreprise_id", entrepriseId)
        .gte("created_at", start)
        .order("created_at", { ascending: false })
        .limit(LIMIT);

      if (queryError) throw new Error(queryError.message);

      const rows = data ?? [];
      setEvents(rows);

      // Résolution des noms d'auteurs (une seule requête pour les ids distincts).
      const actorIds = Array.from(
        new Set(rows.map((r) => r.actor_id).filter((v): v is string => typeof v === "string")),
      );

      if (actorIds.length > 0) {
        const { data: profiles } = await profileNamesTable()
          .select("id, nom")
          .in("id", actorIds);

        const names: Record<string, string> = {};
        (profiles ?? []).forEach((p) => {
          names[p.id] = p.nom?.trim() || "Utilisateur";
        });
        setAuthorNames(names);
      } else {
        setAuthorNames({});
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Impossible de charger l'activité.");
    } finally {
      setIsLoading(false);
    }
  }, [entrepriseId]);

  // Chargement initial + rafraîchissement toutes les 30 s (pas de realtime).
  useEffect(() => {
    void fetchActivity();
  }, [fetchActivity]);

  useEffect(() => {
    if (!entrepriseId) return;
    const id = window.setInterval(() => {
      void fetchActivity();
    }, AUTO_REFRESH_MS);
    return () => window.clearInterval(id);
  }, [entrepriseId, fetchActivity]);

  const filtered = useMemo(
    () => (filter === "all" ? events : events.filter((e) => e.entity_type === filter)),
    [events, filter],
  );

  // Regroupement par tranche horaire, du plus récent au plus ancien.
  const groups = useMemo(() => {
    const byHour = new Map<number, ActivityRow[]>();
    for (const event of filtered) {
      const hour = hourGN(event.created_at) ?? 0;
      const list = byHour.get(hour) ?? [];
      list.push(event);
      byHour.set(hour, list);
    }
    return Array.from(byHour.entries()).sort((a, b) => b[0] - a[0]);
  }, [filtered]);

  const authorName = (actorId: string | null): string => {
    if (!actorId) return "Système";
    return authorNames[actorId] ?? "Utilisateur";
  };

  if (entrepriseLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex relative overflow-x-hidden">
      <FloatingParticles count={20} />
      <DynamicSidebar onSignOut={handleSignOut} />

      <main className="flex-1 lg:ml-64 mesh-gradient min-h-screen">
        <div className="p-4 lg:p-8">
          <div className="max-w-5xl mx-auto relative z-10">
            {/* En-tête */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 premium-header rounded-xl p-4"
            >
              <Button variant="ghost" size="icon" asChild className="self-start sm:self-auto">
                <Link to="/dashboard">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
              </Button>

              <div className="flex-1">
                <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2">
                  <Activity className="w-6 h-6 text-primary" />
                  Activité de la journée
                </h1>
                <p className="text-sm text-muted-foreground">
                  {events.length} événement{events.length > 1 ? "s" : ""} aujourd'hui
                </p>
              </div>

              <Button
                variant="outline"
                className="rounded-xl gap-2 self-start sm:self-auto"
                onClick={() => void fetchActivity()}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                Actualiser
              </Button>
            </motion.div>

            {/* Filtres */}
            <div className="flex flex-wrap gap-2 mb-5">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFilter(f.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    filter === f.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card/60 border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/40"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Erreur */}
            {error && (
              <div className="mb-5 rounded-2xl border border-destructive/40 bg-destructive/5 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-destructive/10 border border-destructive/30 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-destructive">Chargement impossible</p>
                  <p className="text-sm text-muted-foreground">{error}</p>
                </div>
                <Button variant="outline" className="rounded-xl" onClick={() => void fetchActivity()}>
                  Réessayer
                </Button>
              </div>
            )}

            {/* Chargement (squelette) */}
            {isLoading && events.length === 0 && !error && (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-border/40 bg-card/40 p-4 animate-pulse"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-muted/40" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-2/3 rounded bg-muted/40" />
                        <div className="h-2.5 w-1/3 rounded bg-muted/30" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Vide */}
            {!isLoading && !error && filtered.length === 0 && (
              <div className="rounded-2xl border border-border/40 bg-card/40 p-10 text-center">
                <Activity className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="font-medium">Aucune activité aujourd'hui</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {filter === "all"
                    ? "Les actions de votre équipe apparaîtront ici."
                    : "Aucun événement pour ce type aujourd'hui."}
                </p>
              </div>
            )}

            {/* Liste groupée par tranche horaire */}
            {groups.length > 0 && (
              <div className="space-y-6">
                {groups.map(([hour, list]) => (
                  <div key={hour}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {hourRangeLabel(hour)}
                      </span>
                      <div className="flex-1 h-px bg-border/40" />
                      <span className="text-xs text-muted-foreground">{list.length}</span>
                    </div>

                    <div className="space-y-2">
                      {list.map((event) => {
                        const entity = ENTITY_META[event.entity_type] ?? {
                          label: "Élément",
                          icon: Activity,
                        };
                        const action = ACTION_META[event.action] ?? ACTION_META.update;
                        const EntityIcon = entity.icon;
                        const ActionIcon = action.icon;
                        const transition = statusTransition(event.details);

                        return (
                          <div
                            key={event.id}
                            className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm p-3 sm:p-4 flex items-start gap-3"
                          >
                            <div
                              className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${action.className}`}
                              title={action.label}
                            >
                              <ActionIcon className="w-4 h-4" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-medium break-words">
                                  {event.summary}
                                </p>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {formatTime(event.created_at)}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                                <span className="inline-flex items-center gap-1">
                                  <EntityIcon className="w-3 h-3" />
                                  {entity.label}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                                  {authorName(event.actor_id)}
                                </span>
                                {transition && (
                                  <span className="font-mono text-[11px] text-foreground/70">
                                    {transition}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Activite;
