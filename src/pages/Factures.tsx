import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Receipt, Plus, ArrowLeft, CheckCircle, Download, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useEntreprise } from "@/hooks/useEntreprise";
import { FactureDialog } from "@/components/dialogs/FactureDialog";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Facture {
  id: string;
  description: string | null;
  montant: number;
  statut: string;
  date: string;
  clients: { nom: string; telephone: string | null; email: string | null } | null;
}

interface Entreprise {
  nom: string;
  logo: string | null;
  adresse: string | null;
  telephone: string | null;
  email: string | null;
}

const Factures = () => {
  const { entrepriseId, isLoading: entrepriseLoading } = useEntreprise();
  const [factures, setFactures] = useState<Facture[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [entreprise, setEntreprise] = useState<Entreprise | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState("");
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const fetchFactures = useCallback(async () => {
    if (!entrepriseId) return;

    const { data } = await supabase
      .from("factures")
      .select("*, clients(nom, telephone, email)")
      .eq("entreprise_id", entrepriseId)
      .order("date", { ascending: false });

    setFactures(data || []);
    setIsLoading(false);
  }, [entrepriseId]);

  const fetchEntreprise = useCallback(async () => {
    if (!entrepriseId) return;

    const { data } = await supabase
      .from("entreprises")
      .select("nom, logo, adresse, telephone, email")
      .eq("id", entrepriseId)
      .single();

    setEntreprise(data);
  }, [entrepriseId]);

  useEffect(() => {
    if (entrepriseId) {
      fetchFactures();
      fetchEntreprise();
    }
  }, [entrepriseId, fetchFactures, fetchEntreprise]);

  const marquerPayee = async (facture: Facture) => {
    const { error } = await supabase
      .from("factures")
      .update({ statut: "paye" })
      .eq("id", facture.id);

    if (error) {
      toast.error("Erreur lors de la mise à jour");
      return;
    }

    // Insérer dans revenus
    await supabase.from("revenus").insert({
      facture_id: facture.id,
      montant: facture.montant,
      entreprise_id: entrepriseId,
    });

    toast.success("Facture marquée comme payée");
    fetchFactures();
  };

  const generateFacture = async (facture: Facture) => {
    if (!entreprise) {
      toast.error("Informations entreprise non disponibles");
      return;
    }

    setGeneratingId(facture.id);

    try {
      const response = await supabase.functions.invoke("generate-facture", {
        body: {
          entrepriseNom: entreprise.nom,
          entrepriseLogo: entreprise.logo,
          entrepriseAdresse: entreprise.adresse,
          entrepriseTelephone: entreprise.telephone,
          entrepriseEmail: entreprise.email,
          clientNom: facture.clients?.nom || "Client inconnu",
          clientTelephone: facture.clients?.telephone,
          clientEmail: facture.clients?.email,
          description: facture.description,
          montant: facture.montant,
          date: new Date(facture.date).toLocaleDateString("fr-FR"),
          numeroFacture: `FAC-${facture.id.substring(0, 8).toUpperCase()}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setPreviewContent(response.data.content);
      setPreviewOpen(true);
    } catch (error) {
      console.error("Error generating invoice:", error);
      toast.error("Erreur lors de la génération de la facture");
    } finally {
      setGeneratingId(null);
    }
  };

  const downloadAsTxt = () => {
    const blob = new Blob([previewContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "facture.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Facture téléchargée");
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
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => generateFacture(facture)}
                      disabled={generatingId === facture.id}
                    >
                      {generatingId === facture.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <FileText className="w-4 h-4" />
                      )}
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

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Aperçu de la facture
            </DialogTitle>
          </DialogHeader>
          <div className="bg-secondary/30 rounded-lg p-6 whitespace-pre-wrap font-mono text-sm">
            {previewContent}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Fermer
            </Button>
            <Button onClick={downloadAsTxt}>
              <Download className="w-4 h-4 mr-2" />
              Télécharger
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Factures;
