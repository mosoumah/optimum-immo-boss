import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { TrendingUp, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Revenu {
  id: string;
  montant: number;
  date: string;
  factures: { description: string | null; clients: { nom: string } | null } | null;
}

const Revenus = () => {
  const { user } = useAuth();
  const [revenus, setRevenus] = useState<Revenu[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRevenus = async () => {
      if (!user) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("entreprise_id")
        .eq("id", user.id)
        .maybeSingle();

      if (profileData?.entreprise_id) {
        const { data } = await supabase
          .from("revenus")
          .select("*, factures(description, clients(nom))")
          .eq("entreprise_id", profileData.entreprise_id)
          .order("date", { ascending: false });

        setRevenus(data || []);
      }
      setIsLoading(false);
    };

    fetchRevenus();
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
            <h1 className="text-3xl font-bold">Revenus</h1>
            <p className="text-muted-foreground">Suivez vos revenus</p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-border/50 overflow-hidden"
        >
          {revenus.length > 0 ? (
            <div className="divide-y divide-border/50">
              {revenus.map((revenu) => (
                <div key={revenu.id} className="p-4 flex items-center gap-4 hover:bg-secondary/30 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-success" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{revenu.factures?.clients?.nom || "Revenu"}</div>
                    <div className="text-sm text-muted-foreground">{revenu.factures?.description || formatDate(revenu.date)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-success">+{formatCurrency(revenu.montant)}</div>
                    <div className="text-sm text-muted-foreground">{formatDate(revenu.date)}</div>
                  </div>
                </div>
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
    </div>
  );
};

export default Revenus;
