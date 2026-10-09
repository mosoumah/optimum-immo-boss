import { motion } from "framer-motion";
import { Trophy, Building2 } from "lucide-react";
import type { TopPropertyData } from "@/hooks/useDashboardData";

interface Props {
  data: TopPropertyData[];
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("fr-GN", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount) + " GNF";

const medals = ["🥇", "🥈", "🥉"];

export const AdvancedTopProperties = ({ data }: Props) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="p-3 lg:p-4 rounded-2xl card-premium"
    >
      <h2 className="section-title-premium flex items-center gap-3 mb-3">
        <Trophy className="w-5 h-5 text-primary" />
        Top 3 biens du mois
      </h2>
      {data.length > 0 ? (
        <div className="space-y-2">
          {data.map((prop, index) => (
            <div
              key={prop.property_name}
              className="flex items-center gap-3 p-2.5 rounded-xl bg-secondary/20 hover:bg-secondary/40 border border-transparent hover:border-border/30 transition-all duration-300"
            >
              <span className="text-lg">{medals[index] || ""}</span>
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center ring-1 ring-primary/10">
                <Building2 className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{prop.property_name}</div>
              </div>
              <span className="text-sm font-bold text-success">{formatCurrency(prop.total_revenue)}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-muted-foreground">
          <Building2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-xs">Aucune donnée ce mois</p>
        </div>
      )}
    </motion.div>
  );
};
