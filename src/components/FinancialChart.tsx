import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Calendar } from "lucide-react";
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
}

interface Revenu {
  date: string;
  montant: number;
}

interface Depense {
  date: string;
  montant: number;
}

export const FinancialChart = ({ entrepriseId }: FinancialChartProps) => {
  const [period, setPeriod] = useState<Period>("week");
  const [revenus, setRevenus] = useState<Revenu[]>([]);
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      const now = new Date();
      let startDate: Date;

      if (period === "week") {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 6);
      } else {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const startDateStr = startDate.toISOString().split("T")[0];

      const [revenusRes, depensesRes] = await Promise.all([
        supabase
          .from("revenus")
          .select("date, montant")
          .eq("entreprise_id", entrepriseId)
          .gte("date", startDateStr),
        supabase
          .from("depenses")
          .select("date, montant")
          .eq("entreprise_id", entrepriseId)
          .gte("date", startDateStr),
      ]);

      setRevenus(revenusRes.data || []);
      setDepenses(depensesRes.data || []);
      setIsLoading(false);
    };

    if (entrepriseId) {
      fetchData();
    }
  }, [entrepriseId, period]);

  const chartData = useMemo(() => {
    const now = new Date();
    const data: ChartDataPoint[] = [];

    if (period === "week") {
      const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        
        const dayRevenus = revenus
          .filter((r) => r.date === dateStr)
          .reduce((sum, r) => sum + Number(r.montant), 0);
        
        const dayDepenses = depenses
          .filter((d) => d.date === dateStr)
          .reduce((sum, d) => sum + Number(d.montant), 0);

        data.push({
          label: dayNames[date.getDay()],
          revenus: dayRevenus,
          depenses: dayDepenses,
        });
      }
    } else {
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(now.getFullYear(), now.getMonth(), day);
        const dateStr = date.toISOString().split("T")[0];
        
        const dayRevenus = revenus
          .filter((r) => r.date === dateStr)
          .reduce((sum, r) => sum + Number(r.montant), 0);
        
        const dayDepenses = depenses
          .filter((d) => d.date === dateStr)
          .reduce((sum, d) => sum + Number(d.montant), 0);

        data.push({
          label: String(day),
          revenus: dayRevenus,
          depenses: dayDepenses,
        });
      }
    }

    return data;
  }, [revenus, depenses, period]);

  const totals = useMemo(() => {
    const totalRevenus = chartData.reduce((sum, d) => sum + d.revenus, 0);
    const totalDepenses = chartData.reduce((sum, d) => sum + d.depenses, 0);
    return { revenus: totalRevenus, depenses: totalDepenses };
  }, [chartData]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k`;
    }
    return String(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card/95 backdrop-blur-sm border border-border/50 rounded-xl p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-medium" style={{ color: entry.color }}>
                {new Intl.NumberFormat("fr-GN").format(entry.value)} GNF
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 bg-secondary/30 rounded-lg p-1">
          <Button
            variant={period === "week" ? "default" : "ghost"}
            size="sm"
            onClick={() => setPeriod("week")}
            className={`rounded-md h-8 px-3 text-xs ${
              period === "week" 
                ? "bg-primary text-primary-foreground" 
                : "hover:bg-secondary/50"
            }`}
          >
            <Calendar className="w-3.5 h-3.5 mr-1.5" />
            Semaine
          </Button>
          <Button
            variant={period === "month" ? "default" : "ghost"}
            size="sm"
            onClick={() => setPeriod("month")}
            className={`rounded-md h-8 px-3 text-xs ${
              period === "month" 
                ? "bg-primary text-primary-foreground" 
                : "hover:bg-secondary/50"
            }`}
          >
            <Calendar className="w-3.5 h-3.5 mr-1.5" />
            Mois
          </Button>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-success" />
            <span className="text-muted-foreground">Revenus:</span>
            <span className="font-semibold text-success">
              {formatCurrency(totals.revenus)} GNF
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-destructive" />
            <span className="text-muted-foreground">Dépenses:</span>
            <span className="font-semibold text-destructive">
              {formatCurrency(totals.depenses)} GNF
            </span>
          </div>
        </div>
      </div>

      <div className="h-[180px]">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))" 
                opacity={0.3} 
                vertical={false}
              />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                tickFormatter={formatCurrency}
                dx={-5}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--primary) / 0.05)" }} />
              <Bar
                dataKey="revenus"
                name="Revenus"
                fill="hsl(var(--success))"
                radius={[4, 4, 0, 0]}
                maxBarSize={period === "week" ? 40 : 16}
              />
              <Bar
                dataKey="depenses"
                name="Dépenses"
                fill="hsl(var(--destructive))"
                radius={[4, 4, 0, 0]}
                maxBarSize={period === "week" ? 40 : 16}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="flex items-center justify-center gap-4 mt-2 pt-2 border-t border-border/30">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-success" />
          <span className="text-xs text-muted-foreground">Revenus</span>
        </div>
        <div className="flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-destructive" />
          <span className="text-xs text-muted-foreground">Dépenses</span>
        </div>
      </div>
    </div>
  );
};
