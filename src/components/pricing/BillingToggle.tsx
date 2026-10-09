import { motion } from "framer-motion";
import type { BillingCycle } from "@/lib/pricing/plans";

interface Props {
  value: BillingCycle;
  onChange: (v: BillingCycle) => void;
}

export const BillingToggle = ({ value, onChange }: Props) => {
  return (
    <div className="inline-flex items-center gap-2 p-1.5 rounded-full bg-secondary/40 border border-border/40 backdrop-blur-sm relative">
      {(["monthly", "yearly"] as const).map((cycle) => (
        <button
          key={cycle}
          onClick={() => onChange(cycle)}
          className="relative px-5 py-2 rounded-full text-sm font-semibold z-10 transition-colors duration-300"
        >
          {value === cycle && (
            <motion.span
              layoutId="billing-pill"
              className="absolute inset-0 rounded-full bg-primary shadow-lg shadow-primary/30"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span className={`relative ${value === cycle ? "text-primary-foreground" : "text-muted-foreground"}`}>
            {cycle === "monthly" ? "Mensuel" : "Annuel"}
          </span>
        </button>
      ))}
      {value === "yearly" && (
        <motion.span
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          className="ml-2 text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20"
        >
          Économisez 2 mois
        </motion.span>
      )}
    </div>
  );
};
