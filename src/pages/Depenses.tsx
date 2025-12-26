import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { TrendingDown, Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useEntreprise } from "@/hooks/useEntreprise";
import { DepenseDialog } from "@/components/dialogs/DepenseDialog";

interface Depense {
  id: string;
  description: string;
  montant: number;
  date: string;
}

const Depenses = () => {
  const { entrepriseId, isLoading: entrepriseLoading } = useEntreprise();
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [totalMensuel, setTotalMensuel] = useState(0);

  const fetchDepenses = useCallback(async () => {
    if (!entrepriseId) return;

    const { data } = await supabase
      .from("depenses")
      .select("*")
      .eq("entreprise_id", entrepriseId)
      .order("date", { ascending: false });

    setDepenses(data || []);

    // Calculate monthly total
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyTotal = (data || [])
      .filter((d) => new Date(d.date) >= startOfMonth)
      .reduce((sum, d) => sum + Number(d.montant), 0);
    setTotalMensuel(monthlyTotal);

    setIsLoading(false);
  }, [entrepriseId]);

  useEffect(() => {
    if (entrepriseId) {
      fetchDepenses();
    }
  }, [entrepriseId, fetchDepenses]);

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
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Dépenses</h1>
            <p className="text-muted-foreground">Suivez vos dépenses</p>
          </div>
        </div>

        {/* Monthly Widget */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-xl card-gradient border border-border/50 mb-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total du mois</p>
              <p className="text-3xl font-bold text-destructive">{formatCurrency(totalMensuel)}</p>
            </div>
            <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
              <TrendingDown className="w-7 h-7 text-destructive" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-end mb-6"
        >
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle dépense
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-border/50 overflow-hidden"
        >
          {depenses.length > 0 ? (
            <div className="divide-y divide-border/50">
              {depenses.map((depense) => (
                <div key={depense.id} className="p-4 flex items-center gap-4 hover:bg-secondary/30 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                    <TrendingDown className="w-6 h-6 text-destructive" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{depense.description}</div>
                    <div className="text-sm text-muted-foreground">{formatDate(depense.date)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-destructive">-{formatCurrency(depense.montant)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <TrendingDown className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Aucune dépense enregistrée</p>
            </div>
          )}
        </motion.div>
      </div>

      {entrepriseId && (
        <DepenseDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          entrepriseId={entrepriseId}
          onSuccess={fetchDepenses}
        />
      )}
    </div>
  );
};

export default Depenses;
