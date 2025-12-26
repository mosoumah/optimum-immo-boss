import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { TrendingUp, ArrowLeft, Plus } from "lucide-react";
import { FloatingParticles } from "@/components/FloatingParticles";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useEntreprise } from "@/hooks/useEntreprise";
import { RevenuDialog } from "@/components/dialogs/RevenuDialog";

interface Revenu {
  id: string;
  montant: number;
  date: string;
  factures: { description: string | null; clients: { nom: string } | null } | null;
}

const Revenus = () => {
  const { entrepriseId, isLoading: entrepriseLoading } = useEntreprise();
  const [revenus, setRevenus] = useState<Revenu[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalMensuel, setTotalMensuel] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchRevenus = useCallback(async () => {
    if (!entrepriseId) return;

    const { data } = await supabase
      .from("revenus")
      .select("*, factures(description, clients(nom))")
      .eq("entreprise_id", entrepriseId)
      .order("date", { ascending: false });

    setRevenus(data || []);

    // Calculate monthly total
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyTotal = (data || [])
      .filter((r) => new Date(r.date) >= startOfMonth)
      .reduce((sum, r) => sum + Number(r.montant), 0);
    setTotalMensuel(monthlyTotal);

    setIsLoading(false);
  }, [entrepriseId]);

  useEffect(() => {
    if (entrepriseId) {
      fetchRevenus();
    }
  }, [entrepriseId, fetchRevenus]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-GN").format(amount) + " GNF";
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-FR");
  };

  if (entrepriseLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8 relative mesh-gradient">
      <FloatingParticles count={25} />
      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8 premium-header rounded-xl p-4"
        >
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Revenus</h1>
            <p className="text-muted-foreground">Suivez vos revenus</p>
          </div>
        </motion.div>

        {/* Monthly Widget */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-xl card-gradient border border-border/50 mb-6 premium-card"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total du mois</p>
              <p className="text-3xl font-bold text-success">{formatCurrency(totalMensuel)}</p>
            </div>
            <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-success" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-end mb-6"
        >
          <Button onClick={() => setDialogOpen(true)} className="premium-button">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un revenu
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-border/50 overflow-hidden premium-card"
        >
          {revenus.length > 0 ? (
            <div className="divide-y divide-border/50">
              {revenus.map((revenu, index) => (
                <motion.div 
                  key={revenu.id} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 flex items-center gap-4 hover:bg-secondary/30 transition-colors premium-list-item"
                >
                  <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-success" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{revenu.factures?.clients?.nom || "Revenu"}</div>
                    <div className="text-sm text-muted-foreground">{revenu.factures?.description || "Paiement facture"}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-success">+{formatCurrency(revenu.montant)}</div>
                    <div className="text-sm text-muted-foreground">{formatDate(revenu.date)}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Aucun revenu enregistré</p>
            </div>
          )}
        </motion.div>
      </div>

      {entrepriseId && (
        <RevenuDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          entrepriseId={entrepriseId}
          onSuccess={fetchRevenus}
        />
      )}
    </div>
  );
};

export default Revenus;
