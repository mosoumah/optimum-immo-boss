import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Receipt,
  Download,
  LogOut,
  Eye,
  TrendingUp,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { FloatingParticles } from "@/components/FloatingParticles";
import { QuotePreview } from "@/components/QuotePreview";
import { InvoicePreview } from "@/components/InvoicePreview";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface Devis {
  id: string;
  numero_devis: string;
  description: string | null;
  montant: number;
  date: string;
  statut: string;
}

interface Facture {
  id: string;
  description: string | null;
  montant: number;
  date: string;
  statut: string;
}

interface Client {
  id: string;
  nom: string;
  email: string | null;
  telephone: string | null;
}

interface Entreprise {
  nom: string;
  logo: string | null;
  email: string | null;
  telephone: string | null;
  adresse: string | null;
  couleur_primaire: string | null;
  couleur_secondaire: string | null;
  couleur_accent: string | null;
  signature: string | null;
}

const PortailClient = () => {
  const { signOut } = useAuth();
  const { clientId, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();

  const [client, setClient] = useState<Client | null>(null);
  const [entreprise, setEntreprise] = useState<Entreprise | null>(null);
  const [devis, setDevis] = useState<Devis[]>([]);
  const [factures, setFactures] = useState<Facture[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewDevisOpen, setViewDevisOpen] = useState(false);
  const [viewFactureOpen, setViewFactureOpen] = useState(false);
  const [selectedDevis, setSelectedDevis] = useState<Devis | null>(null);
  const [selectedFacture, setSelectedFacture] = useState<Facture | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!clientId) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch client info
        const { data: clientData } = await supabase
          .from("clients")
          .select("id, nom, email, telephone, entreprise_id")
          .eq("id", clientId)
          .maybeSingle();

        if (clientData) {
          setClient(clientData);

          // Fetch entreprise info
          const { data: entrepriseData } = await supabase
            .from("entreprises")
            .select("*")
            .eq("id", (clientData as any).entreprise_id)
            .maybeSingle();

          if (entrepriseData) {
            setEntreprise(entrepriseData);
          }
        }

        // Fetch devis for this client
        const { data: devisData } = await supabase
          .from("devis")
          .select("id, numero_devis, description, montant, date, statut")
          .eq("client_id", clientId)
          .order("date", { ascending: false });

        setDevis(devisData || []);

        // Fetch factures for this client
        const { data: facturesData } = await supabase
          .from("factures")
          .select("id, description, montant, date, statut")
          .eq("client_id", clientId)
          .order("date", { ascending: false });

        setFactures(facturesData || []);
      } catch (error) {
        console.error("Error fetching client data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!roleLoading) {
      fetchData();
    }
  }, [clientId, roleLoading]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-GN", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + " GNF";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusLabel = (statut: string) => {
    const labels: Record<string, string> = {
      brouillon: "Brouillon",
      envoye: "Envoyé",
      accepte: "Accepté",
      refuse: "Refusé",
      non_paye: "Non payé",
      paye: "Payé",
    };
    return labels[statut] || statut;
  };

  const getStatusColor = (statut: string) => {
    if (statut === "accepte" || statut === "paye") return "text-success bg-success/10";
    if (statut === "refuse") return "text-destructive bg-destructive/10";
    if (statut === "envoye" || statut === "non_paye") return "text-warning bg-warning/10";
    return "text-muted-foreground bg-muted";
  };

  const handleDownloadPDF = async (elementId: string, filename: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    const canvas = await html2canvas(element, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(filename);
  };

  const totalDevis = devis.reduce((sum, d) => sum + Number(d.montant), 0);
  const totalFactures = factures.reduce((sum, f) => sum + Number(f.montant), 0);
  const facturesPending = factures.filter((f) => f.statut === "non_paye").length;

  if (isLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center mesh-gradient">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-12 h-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-muted-foreground text-sm">Chargement...</span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen mesh-gradient relative">
      <FloatingParticles count={25} />

      {/* Header */}
      <header className="sticky top-0 z-40 header-gradient backdrop-blur-xl border-b border-border/30">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo size="sm" animated={false} />
            <div className="h-6 w-px bg-border/30" />
            <span className="text-sm text-muted-foreground">Portail Client</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">{client?.nom}</span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <h1 className="text-3xl font-bold mb-2">
            Bienvenue, <span className="text-gradient">{client?.nom?.split(" ")[0]}</span> 👋
          </h1>
          <p className="text-muted-foreground">
            Retrouvez tous vos devis et factures en un seul endroit
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10"
        >
          <div className="card-stat p-6 rounded-2xl border border-border/30">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">Total Devis</span>
              <div className="p-2.5 rounded-xl bg-primary/10">
                <FileText className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(totalDevis)}</div>
            <p className="text-sm text-muted-foreground mt-1">{devis.length} devis</p>
          </div>

          <div className="card-stat p-6 rounded-2xl border border-border/30">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">Total Factures</span>
              <div className="p-2.5 rounded-xl bg-success/10">
                <Receipt className="w-5 h-5 text-success" />
              </div>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(totalFactures)}</div>
            <p className="text-sm text-muted-foreground mt-1">{factures.length} factures</p>
          </div>

          <div className="card-stat p-6 rounded-2xl border border-border/30">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">En attente</span>
              <div className="p-2.5 rounded-xl bg-warning/10">
                <Clock className="w-5 h-5 text-warning" />
              </div>
            </div>
            <div className="text-2xl font-bold">{facturesPending}</div>
            <p className="text-sm text-muted-foreground mt-1">factures à payer</p>
          </div>
        </motion.div>

        {/* Devis Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-10"
        >
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Mes Devis
          </h2>
          <div className="space-y-3">
            {devis.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucun devis disponible
              </div>
            ) : (
              devis.map((d) => (
                <div
                  key={d.id}
                  className="p-4 rounded-xl card-gradient border border-border/30 flex items-center justify-between hover:border-primary/30 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{d.numero_devis || "Devis"}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(d.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(d.statut)}`}>
                      {getStatusLabel(d.statut)}
                    </span>
                    <span className="font-semibold">{formatCurrency(d.montant)}</span>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedDevis(d);
                          setViewDevisOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Factures Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-success" />
            Mes Factures
          </h2>
          <div className="space-y-3">
            {factures.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucune facture disponible
              </div>
            ) : (
              factures.map((f) => (
                <div
                  key={f.id}
                  className="p-4 rounded-xl card-gradient border border-border/30 flex items-center justify-between hover:border-primary/30 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-success/10">
                      <Receipt className="w-4 h-4 text-success" />
                    </div>
                    <div>
                      <p className="font-medium">{f.description || "Facture"}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(f.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(f.statut)}`}>
                      {getStatusLabel(f.statut)}
                    </span>
                    <span className="font-semibold">{formatCurrency(f.montant)}</span>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedFacture(f);
                          setViewFactureOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* View Devis Dialog */}
      <Dialog open={viewDevisOpen} onOpenChange={setViewDevisOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Devis {selectedDevis?.numero_devis}</DialogTitle>
          </DialogHeader>
          {selectedDevis && client && entreprise && (
            <>
              <div id="devis-preview">
                <QuotePreview
                  devis={{
                    id: selectedDevis.id,
                    numero_devis: selectedDevis.numero_devis,
                    description: selectedDevis.description,
                    montant: selectedDevis.montant,
                    date: selectedDevis.date,
                    clients: { nom: client.nom, telephone: client.telephone, email: client.email },
                  }}
                  entreprise={entreprise}
                  aiContent=""
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  onClick={() =>
                    handleDownloadPDF(
                      "devis-preview",
                      `devis-${selectedDevis.numero_devis}.pdf`
                    )
                  }
                >
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger PDF
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* View Facture Dialog */}
      <Dialog open={viewFactureOpen} onOpenChange={setViewFactureOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Facture</DialogTitle>
          </DialogHeader>
          {selectedFacture && client && entreprise && (
            <>
              <div id="facture-preview">
                <InvoicePreview
                  facture={{
                    id: selectedFacture.id,
                    description: selectedFacture.description,
                    montant: selectedFacture.montant,
                    date: selectedFacture.date,
                    clients: { nom: client.nom, telephone: client.telephone, email: client.email },
                  }}
                  entreprise={entreprise}
                  aiContent=""
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  onClick={() =>
                    handleDownloadPDF("facture-preview", `facture-${selectedFacture.id}.pdf`)
                  }
                >
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger PDF
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PortailClient;
