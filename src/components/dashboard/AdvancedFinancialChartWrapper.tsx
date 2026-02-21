import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface Props {
  entrepriseId: string;
}

interface ChartPoint {
  label: string;
  montant: number;
}

type ChartTab = "court_sejour" | "mensuel" | "vente";

export const AdvancedFinancialChartWrapper = ({ entrepriseId }: Props) => {
  const [tab, setTab] = useState<ChartTab>("court_sejour");
  const [courtSejourData, setCourtSejourData] = useState<ChartPoint[]>([]);
  const [mensuelData, setMensuelData] = useState<ChartPoint[]>([]);
  const [venteData, setVenteData] = useState<ChartPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      const startStr = startOfMonth.toISOString().split("T")[0];

      const now = new Date();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

      // Fetch reservations for court_sejour and mensuel
      const { data: reservations } = await supabase
        .from("reservations")
        .select("date_arrivee, montant_total, type_location")
        .eq("entreprise_id", entrepriseId)
        .gte("date_arrivee", startStr);

      // Fetch sales
      const { data: sales } = await supabase
        .from("sales_transactions")
        .select("date_vente, montant_vente")
        .eq("entreprise_id", entrepriseId)
        .gte("date_vente", startStr);

      const csMap: Record<string, number> = {};
      const msMap: Record<string, number> = {};
      const vtMap: Record<string, number> = {};

      for (let d = 1; d <= daysInMonth; d++) {
        const key = String(d);
        csMap[key] = 0;
        msMap[key] = 0;
        vtMap[key] = 0;
      }

      reservations?.forEach((r) => {
        const day = String(new Date(r.date_arrivee).getDate());
        if (r.type_location === "court_sejour") csMap[day] = (csMap[day] || 0) + Number(r.montant_total);
        else if (r.type_location === "mensuel") msMap[day] = (msMap[day] || 0) + Number(r.montant_total);
      });

      sales?.forEach((s) => {
        const day = String(new Date(s.date_vente).getDate());
        vtMap[day] = (vtMap[day] || 0) + Number(s.montant_vente);
      });

      const toArray = (map: Record<string, number>) =>
        Object.entries(map).map(([label, montant]) => ({ label, montant }));

      setCourtSejourData(toArray(csMap));
      setMensuelData(toArray(msMap));
      setVenteData(toArray(vtMap));
      setIsLoading(false);
    };

    if (entrepriseId) fetchData();
  }, [entrepriseId]);

  const currentData = tab === "court_sejour" ? courtSejourData : tab === "mensuel" ? mensuelData : venteData;
  const barColor = tab === "court_sejour" ? "hsl(var(--primary))" : tab === "mensuel" ? "hsl(var(--info))" : "hsl(var(--success))";

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return String(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-card/95 backdrop-blur-sm border border-border/50 rounded-xl p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground mb-1">Jour {label}</p>
          <span className="text-sm font-bold" style={{ color: barColor }}>
            {new Intl.NumberFormat("fr-GN").format(payload[0].value)} GNF
          </span>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="p-3 lg:p-4 rounded-2xl card-premium flex flex-col min-h-[280px]"
    >
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <h2 className="section-title-premium flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          Analyse par type
        </h2>
        <Tabs value={tab} onValueChange={(v) => setTab(v as ChartTab)}>
          <TabsList className="h-8">
            <TabsTrigger value="court_sejour" className="text-xs px-2 h-7">Court séjour</TabsTrigger>
            <TabsTrigger value="mensuel" className="text-xs px-2 h-7">Mensuel</TabsTrigger>
            <TabsTrigger value="vente" className="text-xs px-2 h-7">Vente</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="flex-1 min-h-0">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={currentData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickFormatter={formatCurrency} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--primary) / 0.05)" }} />
              <Bar dataKey="montant" fill={barColor} radius={[4, 4, 0, 0]} maxBarSize={16} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
};
