import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FileText, Plus, ArrowLeft, Receipt, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useEntreprise } from "@/hooks/useEntreprise";
import { DevisDialog } from "@/components/dialogs/DevisDialog";
import { toast } from "sonner";

interface Devis {
  id: string;
  description: string | null;
  montant: number;
  statut: string;
  date: string;
  client_id: string;
  clients: { nom: string } | null;
}

const statutColors: Record<string, string> = {
  brouillon: "bg-muted text-muted-foreground",
  envoye: "bg-blue-500/10 text-blue-500",
  accepte: "bg-success/10 text-success",
  refuse: "bg-destructive/10 text-destructive",
};

const statutLabels: Record<string, string> = {
  brouillon: "Brouillon",
  envoye: "Envoyé",
  accepte: "Accepté",
  refuse: "Refusé",
};

const Devis = () => {
  const { entrepriseId, isLoading: entrepriseLoading } = useEntreprise();
  const [devisList, setDevisList] = useState<Devis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchDevis = useCallback(async () => {
    if (!entrepriseId) return;

    const { data } = await supabase
      .from("devis")
      .select("*, clients(nom)")
      .eq("entreprise_id", entrepriseId)
      .order("date", { ascending: false });

    setDevisList(data || []);
    setIsLoading(false);
  }, [entrepriseId]);

  useEffect(() => {
    if (entrepriseId) {
      fetchDevis();
    }
  }, [entrepriseId, fetchDevis]);

  const transformerEnFacture = async (devis: Devis) => {
    if (!entrepriseId) return;

    const { error } = await supabase.from("factures").insert({
      client_id: devis.client_id,
      montant: devis.montant,
      description: devis.description,
      devis_id: devis.id,
      entreprise_id: entrepriseId,
      statut: "non_paye",
    });

    if (error) {
      toast.error("Erreur lors de la transformation");
      return;
    }

    // Update devis status
    await supabase.from("devis").update({ statut: "accepte" }).eq("id", devis.id);

    toast.success("Facture créée à partir du devis");
    fetchDevis();
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
            <h1 className="text-3xl font-bold">Devis</h1>
            <p className="text-muted-foreground">Gérez vos devis</p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-end mb-6"
        >
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau devis
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-border/50 overflow-hidden"
        >
          {devisList.length > 0 ? (
            <div className="divide-y divide-border/50">
              {devisList.map((devis) => (
                <div key={devis.id} className="p-4 flex items-center gap-4 hover:bg-secondary/30 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{devis.clients?.nom || "Client inconnu"}</div>
                    <div className="text-sm text-muted-foreground">{devis.description || "Sans description"}</div>
                  </div>
                  <div className="text-right mr-4">
                    <div className="font-medium">{formatCurrency(devis.montant)}</div>
                    <Badge className={statutColors[devis.statut]}>{statutLabels[devis.statut]}</Badge>
                  </div>
                  <div className="flex gap-2">
                    {devis.statut !== "accepte" && devis.statut !== "refuse" && (
                      <Button variant="outline" size="sm" onClick={() => transformerEnFacture(devis)}>
                        <Receipt className="w-4 h-4 mr-1" />
                        Transformer
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
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Aucun devis pour le moment</p>
            </div>
          )}
        </motion.div>
      </div>

      {entrepriseId && (
        <DevisDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          entrepriseId={entrepriseId}
          onSuccess={fetchDevis}
        />
      )}
    </div>
  );
};

export default Devis;
