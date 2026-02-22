import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Receipt } from "lucide-react";
import type { SimpleDashboardData } from "@/hooks/useDashboardData";

interface Props {
  data: SimpleDashboardData;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("fr-GN", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount) + " GNF";

export const SimpleFinanceSummary = ({ data }: Props) => {
  const stats = [
    { label: "Revenus du mois", value: formatCurrency(data.revenus_mois), positive: true, icon: TrendingUp },
    { label: "Dépenses du mois", value: formatCurrency(data.depenses_mois), positive: false, icon: TrendingDown },
    { label: "Bénéfice estimé", value: formatCurrency(data.benefice_estime), positive: data.benefice_estime >= 0, icon: TrendingUp },
    { label: "Factures impayées", value: String(data.factures_impayees), positive: data.factures_impayees === 0, icon: Receipt },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 + index * 0.05 }}
          className="card-kpi p-2 lg:p-3 rounded-xl"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="kpi-label text-xs">{stat.label}</span>
            <div className={`p-1.5 rounded-lg ${stat.positive ? "bg-success/10 ring-1 ring-success/20" : "bg-destructive/10 ring-1 ring-destructive/20"}`}>
              <stat.icon className={`w-3.5 h-3.5 ${stat.positive ? "text-success" : "text-destructive"}`} />
            </div>
          </div>
          <div className="text-base lg:text-lg font-bold mb-1.5 break-words">{stat.value}</div>
          <div className="h-0.5 w-full bg-secondary/40 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "60%" }}
              transition={{ duration: 0.8, delay: 0.3 + index * 0.05 }}
              className={`h-full rounded-full ${stat.positive ? "bg-gradient-to-r from-success/60 to-success" : "bg-gradient-to-r from-destructive/60 to-destructive"}`}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
};
