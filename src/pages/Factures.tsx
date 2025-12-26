import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Receipt, Plus, ArrowLeft, CheckCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useEntreprise } from "@/hooks/useEntreprise";
import { FactureDialog } from "@/components/dialogs/FactureDialog";
import { toast } from "sonner";

interface Facture {
  id: string;
  description: string | null;
  montant: number;
  statut: string;
  date: string;
  clients: { nom: string } | null;
}

const Factures = () => {
  const { entrepriseId, isLoading: entrepriseLoading } = useEntreprise();
  const [factures, setFactures] = useState<Facture[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchFactures = useCallback(async () => {
    if (!entrepriseId) return;

    const { data } = await supabase
      .from("factures")
      .select("*, clients(nom)")
      .eq("entreprise_id", entrepriseId)
      .order("date", { ascending: false });

    setFactures(data || []);
    setIsLoading(false);
  }, [entrepriseId]);

  useEffect(() => {
    if (entrepriseId) {
      fetchFactures();
    }
  }, [entrepriseId, fetchFactures]);

  const marquerPayee = async (facture: Facture) => {
    const { error } = await supabase
      .from("factures")
      .update({ statut: "paye" })
      .eq("id", facture.id);

    if (error) {
      toast.error("Erreur lors de la mise à jour");
      return;
    }

    toast.success("Facture marquée comme payée");
    fetchFactures();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-GN").format(amount) + " GNF";
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
            <h1 className="text-3xl font-bold">Factures</h1>
            <p className="text-muted-foreground">Gérez vos factures</p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-end mb-6"
        >
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle facture
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-border/50 overflow-hidden"
        >
          {factures.length > 0 ? (
            <div className="divide-y divide-border/50">
              {factures.map((facture) => (
                <div key={facture.id} className="p-4 flex items-center gap-4 hover:bg-secondary/30 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Receipt className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{facture.clients?.nom || "Client inconnu"}</div>
                    <div className="text-sm text-muted-foreground">{facture.description || "Sans description"}</div>
                  </div>
                  <div className="text-right mr-4">
                    <div className="font-medium">{formatCurrency(facture.montant)}</div>
                    <Badge className={facture.statut === "paye" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}>
                      {facture.statut === "paye" ? "Payée" : "Non payée"}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    {facture.statut !== "paye" && (
                      <Button variant="outline" size="sm" onClick={() => marquerPayee(facture)}>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Marquer payée
                      </Button>
                    )}
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Receipt className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Aucune facture pour le moment</p>
            </div>
          )}
        </motion.div>
      </div>

      {entrepriseId && (
        <FactureDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          entrepriseId={entrepriseId}
          onSuccess={fetchFactures}
        />
      )}
    </div>
  );
};

export default Factures;
