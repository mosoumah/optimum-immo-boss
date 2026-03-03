import { useRef, useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X, Loader2 } from "lucide-react";
import { DocumentPreview } from "@/components/DocumentPreview";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "sonner";

interface ViewDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: {
    id: string;
    type: string;
    contenu: string | null;
    date: string;
  } | null;
  client: {
    nom: string;
    email?: string | null;
    telephone?: string | null;
  } | null;
  entreprise: {
    nom: string;
    logo?: string | null;
    adresse?: string | null;
    telephone?: string | null;
    email?: string | null;
    signature?: string | null;
    couleur_primaire?: string | null;
    couleur_secondaire?: string | null;
    couleur_accent?: string | null;
  } | null;
}

export const ViewDocumentDialog = ({
  open,
  onOpenChange,
  document,
  client,
  entreprise,
}: ViewDocumentDialogProps) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);

  useEffect(() => {
    const convertLogoToDataUrl = async () => {
      if (entreprise?.logo) {
        try {
          const response = await fetch(entreprise.logo, { mode: "cors" });
          const blob = await response.blob();
          const reader = new FileReader();
          reader.onloadend = () => {
            setLogoDataUrl(reader.result as string);
          };
          reader.readAsDataURL(blob);
        } catch (error) {
          console.error("Erreur de conversion du logo:", error);
          setLogoDataUrl(null);
        }
      } else {
        setLogoDataUrl(null);
      }
    };

    if (open && entreprise?.logo) {
      convertLogoToDataUrl();
    }
  }, [open, entreprise?.logo]);

  const handleDownloadPDF = async () => {
    if (!previewRef.current || !document || !entreprise) return;

    setIsDownloading(true);
    try {
      // Clone the element to remove CSS transform that breaks html2canvas
      const clone = previewRef.current.cloneNode(true) as HTMLElement;
      clone.style.transform = "none";
      clone.style.position = "absolute";
      clone.style.left = "-9999px";
      clone.style.top = "0";
      globalThis.document.body.appendChild(clone);

      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        logging: false,
        imageTimeout: 15000,
        onclone: (clonedDoc) => {
          // Ensure all images use crossOrigin
          const imgs = clonedDoc.querySelectorAll("img");
          imgs.forEach((img) => {
            img.crossOrigin = "anonymous";
          });
        },
      });

      clone.remove();

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
      const imgY = 0;

      pdf.addImage(
        imgData,
        "PNG",
        imgX,
        imgY,
        imgWidth * ratio,
        imgHeight * ratio
      );

      const fileName = `${document.type.replace(/\s+/g, "_")}_${new Date(document.date).toISOString().split("T")[0]}.pdf`;
      pdf.save(fileName);
      toast.success("Document téléchargé avec succès");
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
      toast.error("Erreur lors du téléchargement du PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  if (!document || !entreprise) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-auto p-0">
        <DialogHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm p-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">
              {document.type}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="gap-2"
              >
                {isDownloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Télécharger PDF
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        <div className="p-4 flex justify-center bg-muted/30">
          <div className="transform scale-[0.75] origin-top max-w-[95vw]">
            <div ref={previewRef}>
              <DocumentPreview
                entreprise={entreprise}
                document={document}
                client={client}
                logoDataUrl={logoDataUrl}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
