import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";
import { FinancialChart } from "@/components/FinancialChart";

interface Props {
  entrepriseId: string;
}

export const SimpleChart = ({ entrepriseId }: Props) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="p-2 lg:p-3 rounded-2xl card-premium flex flex-col flex-1 min-h-0 h-full"
    >
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <h2 className="section-title-premium flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          Revenus vs Dépenses
        </h2>
        <div className="p-2 rounded-xl bg-secondary/50">
          <BarChart3 className="w-5 h-5 text-muted-foreground" />
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <FinancialChart entrepriseId={entrepriseId} />
      </div>
    </motion.div>
  );
};
