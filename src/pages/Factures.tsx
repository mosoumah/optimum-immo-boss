import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Receipt, Plus, ArrowLeft, CheckCircle, Download, FileText, Loader2, Printer } from "lucide-react";
import { FloatingParticles } from "@/components/FloatingParticles";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useEntreprise } from "@/hooks/useEntreprise";
import { FactureDialog } from "@/components/dialogs/FactureDialog";
import { LogoUpload } from "@/components/LogoUpload";
import { InvoicePreview } from "@/components/InvoicePreview";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
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
  couleur_primaire: string | null;
  couleur_secondaire: string | null;
  couleur_accent: string | null;
}

const Factures = () => {
  const { entrepriseId, isLoading: entrepriseLoading } = useEntreprise();
  const [factures, setFactures] = useState<Facture[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [entreprise, setEntreprise] = useState<Entreprise | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState("");
  const [previewFacture, setPreviewFacture] = useState<Facture | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);

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
      .select("nom, logo, adresse, telephone, email, couleur_primaire, couleur_secondaire, couleur_accent")
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

  // Convert logo URL to DataURL for PDF/HTML export
  const convertLogoToDataUrl = async (logoUrl: string): Promise<string | null> => {
    try {
      const response = await fetch(logoUrl);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  const marquerPayee = async (facture: Facture) => {
    const { error } = await supabase
      .from("factures")
      .update({ statut: "paye" })
      .eq("id", facture.id);

    if (error) {
      toast.error("Erreur lors de la mise à jour");
      return;
    }

    // Le revenu est créé automatiquement par le trigger handle_facture_paid
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
      // Convert logo to DataURL for reliable display
      let dataUrl: string | null = null;
      if (entreprise.logo) {
        dataUrl = await convertLogoToDataUrl(entreprise.logo);
        setLogoDataUrl(dataUrl);
      }

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
      setPreviewFacture(facture);
      setPreviewOpen(true);
    } catch (error) {
      console.error("Error generating invoice:", error);
      toast.error("Erreur lors de la génération de la facture");
    } finally {
      setGeneratingId(null);
    }
  };

  const downloadAsPdf = async () => {
    if (!invoiceRef.current || !previewFacture) return;

    setIsDownloadingPdf(true);

    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      pdf.addImage(imgData, "PNG", imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`facture-${previewFacture.id.substring(0, 8).toUpperCase()}.pdf`);
      toast.success("Facture PDF téléchargée");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Erreur lors de la génération du PDF");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow || !invoiceRef.current) return;

    const logoSrc = logoDataUrl || entreprise?.logo || "";
    const primaryColor = entreprise?.couleur_primaire || "#E97451";
    const secondaryColor = entreprise?.couleur_secondaire || "#FFF5F2";
    const accentColor = entreprise?.couleur_accent || "#1a1a2e";
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Facture - ${previewFacture?.id.substring(0, 8).toUpperCase()}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 20px; color: #1a1a1a; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 2px solid #e5e5e5; padding-bottom: 20px; }
            .logo-section { display: flex; align-items: center; gap: 16px; }
            .logo { width: 80px; height: 80px; object-fit: contain; }
            .company-info h1 { font-size: 24px; font-weight: bold; color: ${accentColor}; }
            .company-info p { font-size: 12px; color: #666; }
            .invoice-title { text-align: right; }
            .invoice-title h2 { font-size: 28px; font-weight: bold; color: ${primaryColor}; }
            .invoice-title p { font-size: 12px; color: #666; margin-top: 8px; }
            .client-section { margin-bottom: 30px; }
            .client-section h3 { font-size: 14px; font-weight: 600; margin-bottom: 8px; color: ${accentColor}; }
            .client-box { background: #f9f9f9; padding: 16px; border-radius: 8px; border: 1px solid #e5e5e5; }
            .client-box p { font-size: 13px; }
            .client-box .name { font-weight: 500; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            thead tr { background: ${primaryColor}; }
            th { padding: 12px; text-align: left; color: white; font-weight: 600; font-size: 13px; }
            th:last-child { text-align: right; }
            td { padding: 12px; font-size: 13px; border-bottom: 1px solid #e5e5e5; }
            td:last-child { text-align: right; }
            tfoot tr { background: ${secondaryColor}; }
            tfoot td { font-weight: bold; color: ${accentColor}; }
            tfoot td:last-child { color: ${primaryColor}; font-size: 16px; }
            .details { background: #f9f9f9; padding: 16px; border-radius: 8px; margin-bottom: 30px; border: 1px solid #e5e5e5; }
            .details h3 { font-size: 14px; font-weight: 600; margin-bottom: 8px; color: ${accentColor}; }
            .details-content { font-size: 12px; color: #555; white-space: pre-wrap; line-height: 1.6; }
            .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5; }
            .footer-text { font-size: 11px; color: #888; }
            .signature { text-align: center; }
            .signature p { font-size: 12px; color: #666; margin-bottom: 30px; }
            .signature-line { width: 180px; border-bottom: 2px solid ${primaryColor}; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo-section">
              ${logoSrc ? `<img src="${logoSrc}" class="logo" />` : ''}
              <div class="company-info">
                <h1>${entreprise?.nom || ''}</h1>
                ${entreprise?.adresse ? `<p>${entreprise.adresse}</p>` : ''}
                ${entreprise?.telephone ? `<p>Tél: ${entreprise.telephone}</p>` : ''}
                ${entreprise?.email ? `<p>${entreprise.email}</p>` : ''}
              </div>
            </div>
            <div class="invoice-title">
              <h2>FACTURE</h2>
              <p>N°: FAC-${previewFacture?.id.substring(0, 8).toUpperCase()}</p>
              <p>Date: ${previewFacture ? new Date(previewFacture.date).toLocaleDateString("fr-FR") : ''}</p>
            </div>
          </div>
          <div class="client-section">
            <h3>Facturé à:</h3>
            <div class="client-box">
              <p class="name">${previewFacture?.clients?.nom || 'Client'}</p>
              ${previewFacture?.clients?.telephone ? `<p>Tél: ${previewFacture.clients.telephone}</p>` : ''}
              ${previewFacture?.clients?.email ? `<p>${previewFacture.clients.email}</p>` : ''}
            </div>
          </div>
          <table>
            <thead>
              <tr><th>Description</th><th>Montant</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>${previewFacture?.description || 'Prestation de service'}</td>
                <td>${previewFacture ? new Intl.NumberFormat("fr-GN").format(previewFacture.montant) + ' GNF' : ''}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td>TOTAL</td>
                <td>${previewFacture ? new Intl.NumberFormat("fr-GN").format(previewFacture.montant) + ' GNF' : ''}</td>
              </tr>
            </tfoot>
          </table>
          ${previewContent ? `
          <div class="details">
            <h3>Détails:</h3>
            <div class="details-content">${previewContent}</div>
          </div>
          ` : ''}
          <div class="footer">
            <div class="footer-text">
              <p>Merci pour votre confiance.</p>
              <p>Paiement à réception de la facture.</p>
            </div>
            <div class="signature">
              <p>Signature et cachet</p>
              <div class="signature-line"></div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);
  };

  const downloadAsHtml = () => {
    if (!previewFacture || !entreprise) return;

    const logoSrc = logoDataUrl || "";
    const primaryColor = entreprise.couleur_primaire || "#E97451";
    const secondaryColor = entreprise.couleur_secondaire || "#FFF5F2";
    const accentColor = entreprise.couleur_accent || "#1a1a2e";
    
    const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Facture ${previewFacture.id.substring(0, 8).toUpperCase()}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; padding: 40px; color: #1a1a1a; max-width: 800px; margin: 0 auto; background: #fff; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 2px solid #e5e5e5; padding-bottom: 20px; }
    .logo-section { display: flex; align-items: center; gap: 16px; }
    .logo { width: 80px; height: 80px; object-fit: contain; }
    .company-info h1 { font-size: 24px; font-weight: bold; margin-bottom: 4px; color: ${accentColor}; }
    .company-info p { font-size: 13px; color: #666; line-height: 1.5; }
    .invoice-title { text-align: right; }
    .invoice-title h2 { font-size: 32px; font-weight: bold; color: ${primaryColor}; }
    .invoice-title p { font-size: 13px; color: #666; margin-top: 8px; }
    .client-section { margin-bottom: 30px; }
    .client-section h3 { font-size: 15px; font-weight: 600; margin-bottom: 10px; color: ${accentColor}; }
    .client-box { background: #f9f9f9; padding: 16px; border-radius: 8px; border: 1px solid #e5e5e5; }
    .client-box p { font-size: 14px; line-height: 1.6; }
    .client-box .name { font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    thead tr { background: ${primaryColor}; }
    th { padding: 14px; text-align: left; color: white; font-weight: 600; font-size: 14px; }
    th:last-child { text-align: right; }
    td { padding: 14px; font-size: 14px; border-bottom: 1px solid #e5e5e5; }
    td:last-child { text-align: right; font-weight: 500; }
    tfoot tr { background: ${secondaryColor}; }
    tfoot td { font-weight: bold; font-size: 15px; color: ${accentColor}; }
    tfoot td:last-child { color: ${primaryColor}; font-size: 18px; }
    .details { background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 30px; border: 1px solid #e5e5e5; }
    .details h3 { font-size: 15px; font-weight: 600; margin-bottom: 12px; color: ${accentColor}; }
    .details-content { font-size: 13px; color: #555; white-space: pre-wrap; line-height: 1.7; }
    .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 50px; padding-top: 20px; border-top: 1px solid #e5e5e5; }
    .footer-text { font-size: 12px; color: #888; line-height: 1.6; }
    .signature { text-align: center; }
    .signature p { font-size: 13px; color: #666; margin-bottom: 40px; }
    .signature-line { width: 200px; border-bottom: 2px solid ${primaryColor}; }
    @media print { body { padding: 20px; } @page { margin: 1cm; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-section">
      ${logoSrc ? `<img src="${logoSrc}" class="logo" alt="Logo" />` : ''}
      <div class="company-info">
        <h1>${entreprise.nom}</h1>
        ${entreprise.adresse ? `<p>${entreprise.adresse}</p>` : ''}
        ${entreprise.telephone ? `<p>Tél: ${entreprise.telephone}</p>` : ''}
        ${entreprise.email ? `<p>${entreprise.email}</p>` : ''}
      </div>
    </div>
    <div class="invoice-title">
      <h2>FACTURE</h2>
      <p>N°: FAC-${previewFacture.id.substring(0, 8).toUpperCase()}</p>
      <p>Date: ${new Date(previewFacture.date).toLocaleDateString("fr-FR")}</p>
    </div>
  </div>
  
  <div class="client-section">
    <h3>Facturé à:</h3>
    <div class="client-box">
      <p class="name">${previewFacture.clients?.nom || 'Client'}</p>
      ${previewFacture.clients?.telephone ? `<p>Tél: ${previewFacture.clients.telephone}</p>` : ''}
      ${previewFacture.clients?.email ? `<p>${previewFacture.clients.email}</p>` : ''}
    </div>
  </div>
  
  <table>
    <thead>
      <tr><th>Description</th><th>Montant</th></tr>
    </thead>
    <tbody>
      <tr>
        <td>${previewFacture.description || 'Prestation de service'}</td>
        <td>${new Intl.NumberFormat("fr-GN").format(previewFacture.montant)} GNF</td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td>TOTAL</td>
        <td>${new Intl.NumberFormat("fr-GN").format(previewFacture.montant)} GNF</td>
      </tr>
    </tfoot>
  </table>
  
  ${previewContent ? `
  <div class="details">
    <h3>Détails:</h3>
    <div class="details-content">${previewContent}</div>
  </div>
  ` : ''}
  
  <div class="footer">
    <div class="footer-text">
      <p>Merci pour votre confiance.</p>
      <p>Paiement à réception de la facture.</p>
    </div>
    <div class="signature">
      <p>Signature et cachet</p>
      <div class="signature-line"></div>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `facture-${previewFacture.id.substring(0, 8).toUpperCase()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Facture HTML téléchargée");
  };

  const handleLogoUpdated = (newLogoUrl: string, colors?: { couleur_primaire: string; couleur_secondaire: string; couleur_accent: string }) => {
    setEntreprise((prev) => prev ? { 
      ...prev, 
      logo: newLogoUrl,
      ...(colors && {
        couleur_primaire: colors.couleur_primaire,
        couleur_secondaire: colors.couleur_secondaire,
        couleur_accent: colors.couleur_accent,
      })
    } : null);
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
            <h1 className="text-3xl font-bold">Factures</h1>
            <p className="text-muted-foreground">Gérez vos factures</p>
          </div>
        </motion.div>

        {/* Logo Upload Section */}
        {entrepriseId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <LogoUpload
              entrepriseId={entrepriseId}
              currentLogo={entreprise?.logo || null}
              onLogoUpdated={handleLogoUpdated}
              currentColors={{
                couleur_primaire: entreprise?.couleur_primaire || null,
                couleur_secondaire: entreprise?.couleur_secondaire || null,
                couleur_accent: entreprise?.couleur_accent || null,
              }}
            />
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex justify-end mb-6"
        >
          <Button onClick={() => setDialogOpen(true)} className="premium-button">
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle facture
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-border/50 overflow-hidden premium-card"
        >
          {factures.length > 0 ? (
            <div className="divide-y divide-border/50">
              {factures.map((facture, index) => (
                <motion.div 
                  key={facture.id} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 flex items-center gap-4 hover:bg-secondary/30 transition-colors premium-list-item"
                >
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
                </motion.div>
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Aperçu de la facture
            </DialogTitle>
          </DialogHeader>

          <InvoicePreview
            ref={invoiceRef}
            entreprise={entreprise}
            facture={previewFacture}
            aiContent={previewContent}
            logoDataUrl={logoDataUrl}
          />

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Fermer
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Imprimer
            </Button>
            <Button variant="outline" onClick={downloadAsHtml}>
              <Download className="w-4 h-4 mr-2" />
              HTML
            </Button>
            <Button onClick={downloadAsPdf} disabled={isDownloadingPdf}>
              {isDownloadingPdf ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Factures;
