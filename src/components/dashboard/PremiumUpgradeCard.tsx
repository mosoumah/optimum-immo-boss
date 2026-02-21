import { motion } from "framer-motion";
import { Lock, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const PremiumUpgradeCard = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center p-8 lg:p-12 rounded-2xl border-2 border-dashed border-primary/30 bg-secondary/10 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 ring-2 ring-primary/20">
        <Lock className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
        <Crown className="w-5 h-5 text-primary" />
        Mode Avancé
      </h3>
      <p className="text-sm text-muted-foreground max-w-md mb-6">
        Accédez aux analyses détaillées, indicateurs immobiliers, alertes intelligentes et résumé IA
        en passant au plan Premium.
      </p>
      <Button
        onClick={() => navigate("/parametres")}
        className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-6"
      >
        Passer au Premium
      </Button>
    </motion.div>
  );
};
