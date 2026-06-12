import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Receipt } from "lucide-react";
import type { SimpleDashboardData } from "@/hooks/useDashboardData";

interface Props {
  data: SimpleDashboardData;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("fr-GN", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount) + " GNF";

const formatCompact = (amount: number) => {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1).replace(".", ",")} Md GNF`;
  if (abs >= 1_000_000) return `${(amount / 1_000_000).toFixed(1).replace(".", ",")} M GNF`;
  if (abs >= 10_000) return `${Math.round(amount / 1000)} k GNF`;
  return formatCurrency(amount);
};

export const SimpleFinanceSummary = ({ data }: Props) => {
  const stats = [
    { label: "Revenus du mois", value: formatCurrency(data.revenus_mois), mobileValue: formatCompact(data.revenus_mois), positive: true, icon: TrendingUp },
    { label: "Dépenses du mois", value: formatCurrency(data.depenses_mois), mobileValue: formatCompact(data.depenses_mois), positive: false, icon: TrendingDown },
    { label: "Bénéfice estimé", value: formatCurrency(data.benefice_estime), mobileValue: formatCompact(data.benefice_estime), positive: data.benefice_estime >= 0, icon: TrendingUp },
    { label: "Factures impayées", value: String(data.factures_impayees), mobileValue: String(data.factures_impayees), positive: data.factures_impayees === 0, icon: Receipt },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-3">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 + index * 0.04 }}
          className="card-kpi p-4 sm:p-2 lg:p-3 rounded-2xl sm:rounded-xl ring-1 ring-primary/10 hover:ring-primary/30 transition-all duration-300 relative overflow-hidden group min-h-[110px] sm:min-h-0 flex flex-col"
        >
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/0 via-primary to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="flex items-start justify-between mb-2 gap-2">
            <span className="kpi-label text-[11px] sm:text-xs uppercase tracking-wide leading-tight">{stat.label}</span>
            <div className={`p-2 sm:p-1.5 rounded-xl sm:rounded-lg flex-shrink-0 ${stat.positive ? "bg-success/10 ring-1 ring-success/20" : "bg-destructive/10 ring-1 ring-destructive/20"}`}>
              <stat.icon className={`w-4 h-4 sm:w-3.5 sm:h-3.5 ${stat.positive ? "text-success" : "text-destructive"}`} />
            </div>
          </div>
          <div className="text-lg sm:text-base lg:text-lg font-bold mb-2 break-words mt-auto">
            <span className="sm:hidden">{stat.mobileValue}</span>
            <span className="hidden sm:inline">{stat.value}</span>
          </div>
          <div className="h-0.5 w-full bg-secondary/40 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "60%" }}
              transition={{ duration: 0.8, delay: 0.2 + index * 0.05 }}
              className={`h-full rounded-full ${stat.positive ? "bg-gradient-to-r from-success/60 to-success" : "bg-gradient-to-r from-destructive/60 to-destructive"}`}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
};
