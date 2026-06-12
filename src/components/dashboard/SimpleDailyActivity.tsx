import { motion } from "framer-motion";
import { LogIn, LogOut, Building, Wallet } from "lucide-react";
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

export const SimpleDailyActivity = ({ data }: Props) => {
  const items = [
    { label: "Arrivées aujourd'hui", value: String(data.arrivees_aujourdhui), mobileValue: String(data.arrivees_aujourdhui), icon: LogIn, color: "text-info", bgColor: "bg-info/10 ring-1 ring-info/20", numValue: data.arrivees_aujourdhui },
    { label: "Séjours en cours", value: String(data.sejours_en_cours), mobileValue: String(data.sejours_en_cours), icon: Building, color: "text-primary", bgColor: "bg-primary/10 ring-1 ring-primary/20", numValue: data.sejours_en_cours },
    { label: "Départs aujourd'hui", value: String(data.departs_aujourdhui), mobileValue: String(data.departs_aujourdhui), icon: LogOut, color: "text-warning", bgColor: "bg-warning/10 ring-1 ring-warning/20", numValue: data.departs_aujourdhui },
    { label: "Paiements attendus", value: formatCurrency(data.paiements_attendus), mobileValue: formatCompact(data.paiements_attendus), icon: Wallet, color: "text-destructive", bgColor: "bg-destructive/10 ring-1 ring-destructive/20", numValue: data.paiements_attendus },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-3">
      {items.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 + index * 0.04 }}
          className="card-kpi p-4 sm:p-2 lg:p-3 rounded-2xl sm:rounded-xl min-h-[110px] sm:min-h-0 flex flex-col"
        >
          <div className="flex items-start justify-between mb-2 gap-2">
            <span className="kpi-label text-[11px] sm:text-xs uppercase tracking-wide leading-tight">{item.label}</span>
            <div className={`p-2 sm:p-1.5 rounded-xl sm:rounded-lg flex-shrink-0 ${item.bgColor}`}>
              <item.icon className={`w-4 h-4 sm:w-3.5 sm:h-3.5 ${item.color}`} />
            </div>
          </div>
          <div className={`text-lg sm:text-base lg:text-lg font-bold break-words mt-auto ${item.numValue > 0 ? "animate-pulse-slow" : ""}`}>
            <span className="sm:hidden">{item.mobileValue}</span>
            <span className="hidden sm:inline">{item.value}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
