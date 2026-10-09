import { motion } from "framer-motion";
import { Home, CalendarDays, Landmark, TrendingDown, TrendingUp, AlertTriangle } from "lucide-react";
import type { AdvancedFinanceData } from "@/hooks/useDashboardData";

interface Props {
  data: AdvancedFinanceData;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("fr-GN", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount) + " GNF";

export const AdvancedFinanceDetails = ({ data }: Props) => {
  const stats = [
    { label: "Revenus court séjour", value: formatCurrency(data.revenus_court_sejour), icon: Home, positive: true },
    { label: "Revenus mensuel", value: formatCurrency(data.revenus_mensuel), icon: CalendarDays, positive: true },
    { label: "Revenus vente", value: formatCurrency(data.revenus_vente), icon: Landmark, positive: true },
    { label: "Dépenses totales", value: formatCurrency(data.depenses_totales), icon: TrendingDown, positive: false },
    { label: "Bénéfice net réel", value: formatCurrency(data.benefice_net), icon: TrendingUp, positive: data.benefice_net >= 0 },
    { label: "Loyers en retard", value: String(data.loyers_en_retard), icon: AlertTriangle, positive: data.loyers_en_retard === 0 },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2 lg:gap-3">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 + index * 0.04 }}
          className="card-kpi p-3 lg:p-4 rounded-xl"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="kpi-label text-xs truncate">{stat.label}</span>
            <div className={`p-1.5 rounded-lg flex-shrink-0 ${stat.positive ? "bg-success/10 ring-1 ring-success/20" : "bg-destructive/10 ring-1 ring-destructive/20"}`}>
              <stat.icon className={`w-3.5 h-3.5 ${stat.positive ? "text-success" : "text-destructive"}`} />
            </div>
          </div>
          <div className="text-sm lg:text-base font-bold break-words">{stat.value}</div>
        </motion.div>
      ))}
    </div>
  );
};
