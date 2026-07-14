import { motion } from "framer-motion";

export const ReassuranceBanner = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
    className="relative overflow-hidden rounded-3xl p-6 sm:p-8 border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent"
  >
    <div className="absolute inset-0 opacity-30 pointer-events-none bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.2),transparent_60%)]" />
    <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="text-4xl">🎉</div>
      <div>
        <h3 className="text-lg sm:text-xl font-bold mb-1">
          Commencez dès aujourd'hui avec 14 jours d'essai gratuits
        </h3>
        <p className="text-sm text-muted-foreground">
          Aucune carte bancaire requise. Toutes les fonctionnalités sont incluses pendant votre période d'essai.
        </p>
      </div>
    </div>
  </motion.div>
);
