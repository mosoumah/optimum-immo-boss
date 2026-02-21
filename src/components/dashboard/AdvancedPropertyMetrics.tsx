import { motion } from "framer-motion";
import { Building2, Home, CalendarCheck, Activity } from "lucide-react";
import type { AdvancedPropertyData } from "@/hooks/useDashboardData";

interface Props {
  data: AdvancedPropertyData;
}

export const AdvancedPropertyMetrics = ({ data }: Props) => {
  const metrics = [
    { label: "Taux d'occupation", value: `${data.taux_occupation}%`, icon: Activity, color: "text-primary" },
    { label: "Biens actifs", value: String(data.biens_total), icon: Building2, color: "text-info" },
    { label: "Réservations en cours", value: String(data.reservations_en_cours), icon: CalendarCheck, color: "text-warning" },
    { label: "Biens disponibles", value: String(data.biens_disponibles), icon: Home, color: "text-success" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3">
      {metrics.map((m, index) => (
        <motion.div
          key={m.label}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 + index * 0.05 }}
          className="card-kpi p-3 lg:p-4 rounded-xl"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="kpi-label text-xs">{m.label}</span>
            <div className="p-1.5 rounded-lg bg-secondary/50">
              <m.icon className={`w-3.5 h-3.5 ${m.color}`} />
            </div>
          </div>
          <div className="text-base lg:text-lg font-bold">{m.value}</div>
        </motion.div>
      ))}
    </div>
  );
};
