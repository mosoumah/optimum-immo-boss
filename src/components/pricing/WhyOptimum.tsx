import { motion } from "framer-motion";
import { Gift, CreditCard, Shield, Cloud, Bot, Smartphone, RefreshCw, MapPin } from "lucide-react";

const items = [
  { icon: Gift, label: "14 jours d'essai gratuits" },
  { icon: CreditCard, label: "Sans carte bancaire à l'inscription" },
  { icon: Shield, label: "Données totalement sécurisées" },
  { icon: Cloud, label: "Hébergement Cloud fiable" },
  { icon: Bot, label: "Assistant IA spécialisé immobilier" },
  { icon: Smartphone, label: "Compatible ordinateur, tablette, mobile" },
  { icon: RefreshCw, label: "Mises à jour automatiques" },
  { icon: MapPin, label: "Développé pour les agences guinéennes" },
];

export const WhyOptimum = () => (
  <div>
    <div className="text-center mb-10">
      <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3">
        Pourquoi choisir <span className="text-gradient">Optimum Immo</span> ?
      </h2>
      <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
        Une solution pensée pour la réalité des agences immobilières guinéennes.
      </p>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
      {items.map((it, i) => (
        <motion.div
          key={it.label}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: i * 0.05 }}
          className="p-5 rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm hover:border-primary/40 hover:shadow-lg transition-all duration-300 group"
        >
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
            <it.icon className="w-5 h-5 text-primary" />
          </div>
          <div className="text-sm font-semibold leading-snug">{it.label}</div>
        </motion.div>
      ))}
    </div>
  </div>
);
