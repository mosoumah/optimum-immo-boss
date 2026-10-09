import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatGNF, type Plan, type BillingCycle } from "@/lib/pricing/plans";
import { cn } from "@/lib/utils";

interface Props {
  plan: Plan;
  cycle: BillingCycle;
  onSelect: (plan: Plan) => void;
  index: number;
}

export const PlanCard = ({ plan, cycle, onSelect, index }: Props) => {
  const price = cycle === "monthly" ? plan.priceMonthly : plan.priceYearly;
  const suffix = cycle === "monthly" ? "/ mois" : "/ an";
  const popular = plan.popular;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative rounded-3xl p-6 sm:p-8 flex flex-col h-full",
        "border transition-all duration-500",
        popular
          ? "border-primary/50 bg-gradient-to-b from-primary/[0.08] to-transparent shadow-2xl shadow-primary/10 lg:scale-105 lg:-my-4 z-10"
          : "border-border/40 bg-card/40 backdrop-blur-sm hover:border-primary/30 hover:shadow-xl"
      )}
    >
      {popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-lg shadow-primary/40">
            <Sparkles className="w-3.5 h-3.5" />
            Le plus populaire
          </div>
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{plan.emoji}</span>
          <h3 className="font-display text-3xl tracking-tight">{plan.name}</h3>
        </div>
        <p className="text-sm text-muted-foreground">{plan.tagline}</p>
      </div>

      <div className="mb-6">
        <motion.div
          key={cycle}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black tracking-tight text-gradient">
              {formatGNF(price)}
            </span>
          </div>
          <div className="text-sm text-muted-foreground mt-1">{suffix}</div>
          {cycle === "yearly" && (
            <div className="mt-2 text-xs font-semibold text-primary">
              Économisez {formatGNF(plan.savingsYearly)}
            </div>
          )}
        </motion.div>
      </div>

      <ul className="space-y-3 mb-8 flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-3 text-sm">
            <span
              className={cn(
                "mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0",
                popular ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
              )}
            >
              <Check className="w-3 h-3" strokeWidth={3} />
            </span>
            <span className="text-foreground/90">{f}</span>
          </li>
        ))}
      </ul>

      <Button
        size="lg"
        onClick={() => onSelect(plan)}
        className={cn(
          "w-full rounded-xl font-semibold h-12 transition-all duration-300",
          popular
            ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/30 hover:shadow-primary/50"
            : "bg-secondary hover:bg-primary hover:text-primary-foreground"
        )}
      >
        {plan.cta}
      </Button>
    </motion.div>
  );
};
