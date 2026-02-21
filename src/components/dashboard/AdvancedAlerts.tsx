import { motion } from "framer-motion";
import { Bell, LogOut, AlertCircle, Home } from "lucide-react";
import type { AlertData } from "@/hooks/useDashboardData";

interface Props {
  data: AlertData[];
}

const alertConfig: Record<string, { icon: typeof Bell; color: string; label: string }> = {
  depart_imminent: { icon: LogOut, color: "text-warning", label: "Départ imminent" },
  paiement_retard: { icon: AlertCircle, color: "text-destructive", label: "Paiement en retard" },
  bien_bientot_disponible: { icon: Home, color: "text-info", label: "Bientôt disponible" },
};

export const AdvancedAlerts = ({ data }: Props) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25 }}
      className="p-3 lg:p-4 rounded-2xl card-premium"
    >
      <h2 className="section-title-premium flex items-center gap-3 mb-3">
        <Bell className="w-5 h-5 text-warning" />
        Alertes intelligentes
      </h2>
      {data.length > 0 ? (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {data.map((alert) => {
            const config = alertConfig[alert.alert_type] || alertConfig.depart_imminent;
            const Icon = config.icon;
            return (
              <div
                key={alert.id}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-secondary/20 border border-transparent hover:border-border/30 transition-all duration-300"
              >
                <div className="p-1.5 rounded-lg bg-secondary/50">
                  <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground">{config.label}</div>
                  <div className="font-medium text-sm truncate">{alert.label || "—"}</div>
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0">{alert.detail}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-6 text-muted-foreground">
          <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-xs">Aucune alerte</p>
        </div>
      )}
    </motion.div>
  );
};
