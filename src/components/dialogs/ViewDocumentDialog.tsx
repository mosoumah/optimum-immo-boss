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

  // Find the best row to break at (scan for mostly-white rows to avoid cutting text)
  const findSafeBreakPoint = (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    idealY: number,
    searchRange: number
  ): number => {
    const width = canvas.width;
    // Search upward from idealY to find a row that's mostly white/background
    for (let y = idealY; y > idealY - searchRange && y > 0; y--) {
      const rowData = ctx.getImageData(0, y, width, 1).data;
      let isWhiteRow = true;
      // Sample every 4th pixel for performance
      for (let x = 0; x < width * 4; x += 16) {
        const r = rowData[x];
        const g = rowData[x + 1];
        const b = rowData[x + 2];
        // Check if pixel is near-white (background)
        if (r < 240 || g < 240 || b < 240) {
          isWhiteRow = false;
          break;
        }
      }
      if (isWhiteRow) return y;
    }
    // If no safe break found, use the ideal position
    return idealY;
  };

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
      clone.style.width = "794px"; // A4 width at 96dpi
      globalThis.document.body.appendChild(clone);

      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        logging: false,
        imageTimeout: 15000,
        onclone: (clonedDoc) => {
          const imgs = clonedDoc.querySelectorAll("img");
          imgs.forEach((img) => {
            img.crossOrigin = "anonymous";
          });
        },
      });

      clone.remove();

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm
      const margin = 5; // mm margin for page numbers
      const contentHeight = pdfHeight - margin; // leave space for page number at bottom

      // Calculate the pixel height of one A4 page based on canvas width
      const pageHeightPx = Math.floor((contentHeight / pdfWidth) * canvas.width);
      const searchRange = Math.floor(pageHeightPx * 0.15); // search 15% of page height for safe breaks

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context unavailable");

      // Calculate all page break points using smart breaks
      const breakPoints: number[] = [0];
      let currentY = 0;
      while (currentY + pageHeightPx < canvas.height) {
        const idealBreak = currentY + pageHeightPx;
        const safeBreak = findSafeBreakPoint(canvas, ctx, idealBreak, searchRange);
        breakPoints.push(safeBreak);
        currentY = safeBreak;
      }
      // Last page goes to the end
      if (breakPoints[breakPoints.length - 1] < canvas.height) {
        breakPoints.push(canvas.height);
      }

      const totalPages = breakPoints.length - 1;

      for (let page = 0; page < totalPages; page++) {
        if (page > 0) pdf.addPage();

        const sliceY = breakPoints[page];
        const sliceHeight = breakPoints[page + 1] - sliceY;

        // Create a cropped canvas for this page
        const pageCanvas = globalThis.document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeight;
        const pageCtx = pageCanvas.getContext("2d");
        if (!pageCtx) continue;

        // Fill with white background first
        pageCtx.fillStyle = "#ffffff";
        pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

        // Draw the slice from the main canvas
        pageCtx.drawImage(
          canvas,
          0, sliceY, canvas.width, sliceHeight,
          0, 0, canvas.width, sliceHeight
        );

        const sliceRatio = pdfWidth / pageCanvas.width;
        const renderedHeight = pageCanvas.height * sliceRatio;

        pdf.addImage(
          pageCanvas.toDataURL("image/png"),
          "PNG",
          0,
          0,
          pdfWidth,
          renderedHeight
        );

        // Add page number
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(
          `Page ${page + 1} / ${totalPages}`,
          pdfWidth / 2,
          pdfHeight - 2,
          { align: "center" }
        );
      }

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
