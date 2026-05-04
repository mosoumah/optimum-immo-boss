import { useState, useEffect, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Calendar, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface FinancialChartProps {
  entrepriseId: string;
}

type Period = "week" | "month";

interface ChartDataPoint {
  label: string;
  revenus: number;
  depenses: number;
  taux: number;
}

interface Revenu {
  date: string;
  montant: number;
}

interface Depense {
  date: string;
  montant: number;
}

interface ReservationRange {
  date_arrivee: string;
  date_depart: string;
  statut: string;
}

const formatLocalDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const ACTIVE_STATUTS = new Set(["en_attente", "en_cours", "confirmee", "confirmée"]);

export const FinancialChart = ({ entrepriseId }: FinancialChartProps) => {
  const [period, setPeriod] = useState<Period>("week");
  const [revenus, setRevenus] = useState<Revenu[]>([]);
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [prevRevenus, setPrevRevenus] = useState<Revenu[]>([]);
  const [prevDepenses, setPrevDepenses] = useState<Depense[]>([]);
  const [reservations, setReservations] = useState<ReservationRange[]>([]);
  const [prevReservations, setPrevReservations] = useState<ReservationRange[]>([]);
  const [totalBiens, setTotalBiens] = useState<number>(0);
  const [periodRange, setPeriodRange] = useState<{ prevStart: string; prevEnd: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [realtimeTick, setRealtimeTick] = useState(0);

  // Realtime subscription to auto-refresh chart
  useEffect(() => {
    const channel = supabase
      .channel("chart-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "revenus" }, () => {
        setRealtimeTick((t) => t + 1);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "depenses" }, () => {
        setRealtimeTick((t) => t + 1);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "factures" }, () => {
        setRealtimeTick((t) => t + 1);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations" }, () => {
        setRealtimeTick((t) => t + 1);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "properties" }, () => {
        setRealtimeTick((t) => t + 1);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const now = new Date();
      let startDate: Date;
      let endDate: Date;
      let prevStartDate: Date;
      let prevEndDate: Date;

      if (period === "week") {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 6);
        endDate = new Date(now);
        prevStartDate = new Date(startDate);
        prevStartDate.setDate(prevStartDate.getDate() - 7);
        prevEndDate = new Date(startDate);
        prevEndDate.setDate(prevEndDate.getDate() - 1);
      } else {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        prevEndDate = new Date(now.getFullYear(), now.getMonth(), 0);
      }

      const startDateStr = formatLocalDate(startDate);
      const endDateStr = formatLocalDate(endDate);
      const prevStartStr = formatLocalDate(prevStartDate);
      const prevEndStr = formatLocalDate(prevEndDate);

      const [revenusRes, depensesRes, prevRevenusRes, prevDepensesRes, resaRes, prevResaRes, biensRes] = await Promise.all([
        supabase.from("revenus").select("date, montant").eq("entreprise_id", entrepriseId).gte("date", startDateStr),
        supabase.from("depenses").select("date, montant").eq("entreprise_id", entrepriseId).gte("date", startDateStr),
        supabase.from("revenus").select("date, montant").eq("entreprise_id", entrepriseId).gte("date", prevStartStr).lte("date", prevEndStr),
        supabase.from("depenses").select("date, montant").eq("entreprise_id", entrepriseId).gte("date", prevStartStr).lte("date", prevEndStr),
        supabase
          .from("reservations")
          .select("date_arrivee, date_depart, statut")
          .eq("entreprise_id", entrepriseId)
          .lte("date_arrivee", endDateStr)
          .gte("date_depart", startDateStr),
        supabase
          .from("reservations")
          .select("date_arrivee, date_depart, statut")
          .eq("entreprise_id", entrepriseId)
          .lte("date_arrivee", prevEndStr)
          .gte("date_depart", prevStartStr),
        supabase.from("properties").select("id", { count: "exact", head: true }).eq("entreprise_id", entrepriseId),
      ]);

      setRevenus(revenusRes.data || []);
      setDepenses(depensesRes.data || []);
      setPrevRevenus(prevRevenusRes.data || []);
      setPrevDepenses(prevDepensesRes.data || []);
      setReservations((resaRes.data as ReservationRange[]) || []);
      setPrevReservations((prevResaRes.data as ReservationRange[]) || []);
      setTotalBiens(biensRes.count || 0);
      setPeriodRange({ prevStart: prevStartStr, prevEnd: prevEndStr });
      setIsLoading(false);
    };

    if (entrepriseId) fetchData();
  }, [entrepriseId, period, realtimeTick]);

  const computeTaux = (dateStr: string): number => {
    if (totalBiens <= 0) return 0;
    const occupes = reservations.filter(
      (r) => ACTIVE_STATUTS.has(r.statut) && r.date_arrivee <= dateStr && r.date_depart >= dateStr
    ).length;
    const ratio = (occupes / totalBiens) * 100;
    return Math.min(100, Math.round(ratio * 10) / 10);
  };

  const chartData = useMemo(() => {
    const now = new Date();
    const data: ChartDataPoint[] = [];

    if (period === "week") {
      const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        const dateStr = formatLocalDate(date);
        data.push({
          label: dayNames[date.getDay()],
          revenus: revenus.filter((r) => r.date === dateStr).reduce((sum, r) => sum + Number(r.montant), 0),
          depenses: depenses.filter((d) => d.date === dateStr).reduce((sum, d) => sum + Number(d.montant), 0),
          taux: computeTaux(dateStr),
        });
      }
    } else {
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(now.getFullYear(), now.getMonth(), day);
        const dateStr = formatLocalDate(date);
        data.push({
          label: String(day),
          revenus: revenus.filter((r) => r.date === dateStr).reduce((sum, r) => sum + Number(r.montant), 0),
          depenses: depenses.filter((d) => d.date === dateStr).reduce((sum, d) => sum + Number(d.montant), 0),
          taux: computeTaux(dateStr),
        });
      }
    }
    return data;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revenus, depenses, period, reservations, totalBiens]);

  const totals = useMemo(() => {
    const totalRevenus = chartData.reduce((sum, d) => sum + d.revenus, 0);
    const totalDepenses = chartData.reduce((sum, d) => sum + d.depenses, 0);
    const benefice = totalRevenus - totalDepenses;
    const tauxMoyen = chartData.length > 0
      ? chartData.reduce((sum, d) => sum + d.taux, 0) / chartData.length
      : 0;

    const prevTotalRevenus = prevRevenus.reduce((sum, r) => sum + Number(r.montant), 0);
    const prevTotalDepenses = prevDepenses.reduce((sum, d) => sum + Number(d.montant), 0);
    const prevBenefice = prevTotalRevenus - prevTotalDepenses;

    let variation = 0;
    if (prevBenefice !== 0) {
      variation = ((benefice - prevBenefice) / Math.abs(prevBenefice)) * 100;
    } else if (benefice > 0) {
      variation = 100;
    }

    return { revenus: totalRevenus, depenses: totalDepenses, benefice, variation, tauxMoyen };
  }, [chartData, prevRevenus, prevDepenses]);

  const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`;
    if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return String(Math.round(value));
  };

  interface TooltipEntry { name: string; value: number; color: string; dataKey?: string; }
  interface TooltipProps { active?: boolean; payload?: TooltipEntry[]; label?: string; }

  const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card/95 backdrop-blur-sm border border-border/50 rounded-xl p-3 shadow-lg">
          <p className="text-xs font-medium text-foreground mb-2">{label}</p>
          {payload.map((entry, index: number) => {
            const isTaux = entry.dataKey === "taux";
            return (
              <div key={index} className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-muted-foreground">{entry.name}:</span>
                <span className="font-semibold" style={{ color: entry.color }}>
                  {isTaux
                    ? `${entry.value.toFixed(1)} %`
                    : `${new Intl.NumberFormat("fr-GN").format(entry.value)} GNF`}
                </span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  const isPositive = totals.variation >= 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header: period toggle */}
      <div className="flex items-center justify-between mb-1 flex-shrink-0">
        <div className="flex items-center gap-1 bg-secondary/30 rounded-lg p-0.5">
          <Button
            variant={period === "week" ? "default" : "ghost"}
            size="sm"
            onClick={() => setPeriod("week")}
            className={`rounded-md h-7 px-2.5 text-xs ${period === "week" ? "bg-primary text-primary-foreground" : "hover:bg-secondary/50"}`}
          >
            <Calendar className="w-3 h-3 mr-1" />
            Semaine
          </Button>
          <Button
            variant={period === "month" ? "default" : "ghost"}
            size="sm"
            onClick={() => setPeriod("month")}
            className={`rounded-md h-7 px-2.5 text-xs ${period === "month" ? "bg-primary text-primary-foreground" : "hover:bg-secondary/50"}`}
          >
            <Calendar className="w-3 h-3 mr-1" />
            Mois
          </Button>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-success shadow-[0_0_6px_hsl(var(--success)/0.6)]" />
            <span className="text-muted-foreground">Revenus</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-destructive shadow-[0_0_6px_hsl(var(--destructive)/0.6)]" />
            <span className="text-muted-foreground">Dépenses</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-muted-foreground/70 shadow-[0_0_6px_rgba(156,163,175,0.6)]" />
            <span className="text-muted-foreground">Taux de réservation</span>
          </span>
        </div>
      </div>

      {/* Main content: left summary + right chart */}
      <div className="flex flex-1 min-h-0 gap-2">
        {/* Left: Benefice summary */}
        <div className="flex flex-col justify-start items-start w-1/4 min-w-[140px] pr-3 border-r border-border/30 overflow-hidden gap-1">
          <span className="text-[11px] uppercase tracking-widest text-muted-foreground/80 font-medium leading-none">
            Bénéfice {period === "week" ? "semaine" : "mois"}
          </span>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className={`text-base lg:text-lg font-bold leading-tight ${totals.benefice >= 0 ? "text-success" : "text-destructive"}`}>
              {formatCurrency(totals.benefice)}
            </span>
            <span className="text-[11px] font-normal text-muted-foreground/80">GNF</span>
            <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[11px] font-semibold ${isPositive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {isPositive ? "+" : ""}{totals.variation.toFixed(1)}%
            </div>
          </div>
          <span className="text-[10px] text-muted-foreground/70 leading-none">
            vs {period === "week" ? "sem." : "mois"} préc.
          </span>

          <div className="grid grid-cols-3 gap-x-2 gap-y-0.5 w-full mt-1.5 pt-1.5 border-t border-border/20">
            <div>
              <span className="text-[10px] text-muted-foreground/80 block leading-tight">Revenus</span>
              <span className="text-xs font-semibold text-success leading-tight">{formatCurrency(totals.revenus)} GNF</span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground/80 block leading-tight">Dépenses</span>
              <span className="text-xs font-semibold text-destructive leading-tight">{formatCurrency(totals.depenses)} GNF</span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground/80 block leading-tight flex items-center gap-0.5">
                <Percent className="w-2.5 h-2.5" />
                Taux résa
              </span>
              <span className="text-xs font-semibold text-muted-foreground leading-tight drop-shadow-[0_0_4px_rgba(156,163,175,0.4)]">
                {totals.tauxMoyen.toFixed(1)} %
              </span>
            </div>
          </div>
        </div>

        {/* Right: Line chart */}
        <div className="flex-1 min-h-0">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradientRevenus" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradientDepenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradientTaux" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#9ca3af" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#9ca3af" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.15} vertical={false} />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                  dy={5}
                  interval={period === "month" ? 4 : 0}
                />
                <YAxis
                  yAxisId="left"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                  tickFormatter={formatCurrency}
                  dx={-3}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "rgba(156,163,175,0.7)", fontSize: 9 }}
                  tickFormatter={(v) => `${v}%`}
                  domain={[0, 100]}
                  width={28}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenus"
                  name="Revenus"
                  stroke="hsl(var(--success))"
                  strokeWidth={2}
                  fill="url(#gradientRevenus)"
                  fillOpacity={1}
                  dot={false}
                  activeDot={{ r: 4, fill: "hsl(var(--success))", strokeWidth: 0 }}
                  animationDuration={900}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="depenses"
                  name="Dépenses"
                  stroke="hsl(var(--destructive))"
                  strokeWidth={2}
                  fill="url(#gradientDepenses)"
                  fillOpacity={1}
                  dot={false}
                  activeDot={{ r: 4, fill: "hsl(var(--destructive))", strokeWidth: 0 }}
                  animationDuration={900}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="taux"
                  name="Taux de réservation"
                  stroke="#9ca3af"
                  strokeWidth={1.8}
                  strokeDasharray="4 4"
                  fill="url(#gradientTaux)"
                  fillOpacity={1}
                  dot={false}
                  activeDot={{ r: 4, fill: "#9ca3af", strokeWidth: 0 }}
                  animationDuration={1100}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};
