import { motion } from "framer-motion";
import { LogIn, LogOut, CheckSquare, Wallet } from "lucide-react";
import type { SimpleDashboardData } from "@/hooks/useDashboardData";

interface Props {
  data: SimpleDashboardData;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("fr-GN", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount) + " GNF";

export const SimpleDailyActivity = ({ data }: Props) => {
  const items = [
    { label: "Arrivées aujourd'hui", value: String(data.arrivees_aujourdhui), icon: LogIn, color: "text-info" },
    { label: "Départs aujourd'hui", value: String(data.departs_aujourdhui), icon: LogOut, color: "text-warning" },
    { label: "Tâches urgentes", value: String(data.taches_urgentes), icon: CheckSquare, color: "text-destructive" },
    { label: "Paiements attendus", value: formatCurrency(data.paiements_attendus), icon: Wallet, color: "text-primary" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3">
      {items.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 + index * 0.05 }}
          className="card-kpi p-3 lg:p-4 rounded-xl"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="kpi-label text-xs">{item.label}</span>
            <div className="p-1.5 rounded-lg bg-secondary/50">
              <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
            </div>
          </div>
          <div className="text-base lg:text-lg font-bold break-words">{item.value}</div>
        </motion.div>
      ))}
    </div>
  );
};
