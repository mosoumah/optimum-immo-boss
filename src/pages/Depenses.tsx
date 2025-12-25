import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { TrendingDown, Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Depense {
  id: string;
  description: string;
  montant: number;
  date: string;
}

const Depenses = () => {
  const { user } = useAuth();
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDepenses = async () => {
      if (!user) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("entreprise_id")
        .eq("id", user.id)
        .maybeSingle();

      if (profileData?.entreprise_id) {
        const { data } = await supabase
          .from("depenses")
          .select("*")
          .eq("entreprise_id", profileData.entreprise_id)
          .order("date", { ascending: false });

        setDepenses(data || []);
      }
      setIsLoading(false);
    };

    fetchDepenses();
  }, [user]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-GN").format(amount) + " GNF";
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-FR");
  };

  if (isLoading) {
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-end mb-6"
        >
          <Button>
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
    </div>
  );
};

export default Depenses;
