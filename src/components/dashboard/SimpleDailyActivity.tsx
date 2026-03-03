import { motion } from "framer-motion";
import { LogIn, LogOut, Building, Wallet } from "lucide-react";
import type { SimpleDashboardData } from "@/hooks/useDashboardData";

interface Props {
  data: SimpleDashboardData;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("fr-GN", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount) + " GNF";

export const SimpleDailyActivity = ({ data }: Props) => {
  const items = [
    { label: "Arrivées aujourd'hui", value: String(data.arrivees_aujourdhui), icon: LogIn, color: "text-info", bgColor: "bg-info/10 ring-1 ring-info/20", numValue: data.arrivees_aujourdhui },
    { label: "Séjours en cours", value: String(data.sejours_en_cours), icon: Building, color: "text-primary", bgColor: "bg-primary/10 ring-1 ring-primary/20", numValue: data.sejours_en_cours },
    { label: "Départs aujourd'hui", value: String(data.departs_aujourdhui), icon: LogOut, color: "text-warning", bgColor: "bg-warning/10 ring-1 ring-warning/20", numValue: data.departs_aujourdhui },
    { label: "Paiements attendus", value: formatCurrency(data.paiements_attendus), icon: Wallet, color: "text-destructive", bgColor: "bg-destructive/10 ring-1 ring-destructive/20", numValue: data.paiements_attendus },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3">
      {items.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 + index * 0.05 }}
          className="card-kpi p-2 lg:p-3 rounded-xl"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="kpi-label text-xs">{item.label}</span>
            <div className={`p-1.5 rounded-lg ${item.bgColor}`}>
              <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
            </div>
          </div>
          <div className={`text-base lg:text-lg font-bold break-words ${item.numValue > 0 ? "animate-pulse-slow" : ""}`}>{item.value}</div>
        </motion.div>
      ))}
    </div>
  );
};
