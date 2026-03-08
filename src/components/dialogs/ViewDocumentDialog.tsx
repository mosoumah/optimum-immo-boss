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

  // Robust page-break finder: scans central content area for lowest ink-density band
  const findSafeBreakPoint = (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    idealY: number,
    searchRange: number,
    minY: number
  ): number => {
    const width = canvas.width;
    const leftBound = Math.floor(width * 0.20);
    const rightBound = Math.floor(width * 0.80);
    const scanWidth = rightBound - leftBound;
    const bandHeight = 40; // cover a full line to find real paragraph gaps
    const halfBand = Math.floor(bandHeight / 2);

    let bestY = idealY;
    let bestDensity = Infinity;

    const startY = Math.min(idealY, canvas.height - 1);
    const upperLimit = Math.max(idealY - searchRange, minY + 1);
    const lowerLimit = Math.min(idealY + Math.floor(searchRange * 0.5), canvas.height - 1);

    for (let y = startY; y >= upperLimit; y--) {
      const bandTop = Math.max(y - halfBand, 0);
      const bandBot = Math.min(y + halfBand, canvas.height - 1);
      const bh = bandBot - bandTop + 1;

      const rowData = ctx.getImageData(leftBound, bandTop, scanWidth, bh).data;
      let inkPixels = 0;
      let totalPixels = 0;
      for (let i = 0; i < rowData.length; i += 4) {
        const r = rowData[i];
        const g = rowData[i + 1];
        const b = rowData[i + 2];
        totalPixels++;
        if (r < 200 || g < 200 || b < 200) {
          inkPixels++;
        }
      }
      const density = inkPixels / Math.max(totalPixels, 1);

      if (density < bestDensity) {
        bestDensity = density;
        bestY = y;
        if (density < 0.02) return y;
      }
    }

    if (bestDensity > 0.05) {
      for (let y = startY + 1; y <= lowerLimit; y++) {
        const bandTop = Math.max(y - halfBand, 0);
        const bandBot = Math.min(y + halfBand, canvas.height - 1);
        const bh = bandBot - bandTop + 1;

        const rowData = ctx.getImageData(leftBound, bandTop, scanWidth, bh).data;
        let inkPixels = 0;
        let totalPixels = 0;
        for (let i = 0; i < rowData.length; i += 4) {
          const r = rowData[i];
          const g = rowData[i + 1];
          const b = rowData[i + 2];
          totalPixels++;
          if (r < 200 || g < 200 || b < 200) {
            inkPixels++;
          }
        }
        const density = inkPixels / Math.max(totalPixels, 1);

        if (density < bestDensity) {
          bestDensity = density;
          bestY = y;
          if (density < 0.02) return y;
        }
      }
    }

    return bestY;
  };

  const collectDomBreakCandidates = (root: HTMLElement): number[] => {
    const nodes = Array.from(root.querySelectorAll<HTMLElement>("h1, h2, h3, h4, p, li, div"));
    const candidates: number[] = [];

    for (const node of nodes) {
      const text = node.innerText?.trim() || "";
      const top = Math.round(node.offsetTop);
      const height = Math.round(node.offsetHeight);

      if (top <= 0 || height < 24) continue;
      if (text.length < 20 && !node.querySelector("img")) continue;

      candidates.push(top);
    }

    candidates.sort((a, b) => a - b);

    // Dedupe close points (same visual line/section)
    const deduped: number[] = [];
    for (const point of candidates) {
      const last = deduped[deduped.length - 1];
      if (last === undefined || Math.abs(point - last) > 18) {
        deduped.push(point);
      }
    }

    return deduped;
  };

  const findDomBreakPoint = (
    candidates: number[],
    idealY: number,
    minY: number,
    maxY: number
  ): number | null => {
    const inWindow = candidates.filter((p) => p >= minY && p <= maxY);
    if (inWindow.length === 0) return null;

    const belowOrEqual = inWindow.filter((p) => p <= idealY);
    if (belowOrEqual.length > 0) {
      return belowOrEqual[belowOrEqual.length - 1];
    }

    return inWindow[0] ?? null;
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

      const domBreakCandidates = collectDomBreakCandidates(clone);

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
      const searchRange = Math.floor(pageHeightPx * 0.25); // search 25% of page height for safe breaks
      const safetyPadding = 10; // pixels to avoid clipping glyphs at break edges

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context unavailable");

      // Minimum slice height: 30% of a page to avoid tiny fragments
      const minSliceHeightPx = Math.floor(pageHeightPx * 0.3);

      // Calculate all page break points using DOM-aware breaks first, then pixel fallback
      const breakPoints: number[] = [0];
      let currentY = 0;
      while (currentY + pageHeightPx < canvas.height) {
        const idealBreak = currentY + pageHeightPx;
        const minBreakY = currentY + minSliceHeightPx;
        const maxBreakY = Math.min(idealBreak + Math.floor(searchRange * 0.8), canvas.height - 1);

        const domBreak = findDomBreakPoint(domBreakCandidates, idealBreak, minBreakY, maxBreakY);
        const fallbackBreak = findSafeBreakPoint(canvas, ctx, idealBreak, searchRange, minBreakY);

        const chosenBreak = domBreak ?? fallbackBreak;
        const nextBreak = Math.max(Math.min(chosenBreak, canvas.height - 1), currentY + minSliceHeightPx);

        breakPoints.push(nextBreak);
        currentY = nextBreak;
      }

      if (breakPoints[breakPoints.length - 1] < canvas.height) {
        breakPoints.push(canvas.height);
      }

      const totalPages = breakPoints.length - 1;

      for (let page = 0; page < totalPages; page++) {
        if (page > 0) pdf.addPage();

        const rawSliceY = breakPoints[page];
        const rawSliceEnd = breakPoints[page + 1];
        // Apply safety padding to avoid cutting glyphs at edges
        const sliceY = page === 0 ? rawSliceY : rawSliceY + safetyPadding;
        const sliceEnd = page === totalPages - 1 ? rawSliceEnd : rawSliceEnd - safetyPadding;
        const sliceHeight = Math.max(sliceEnd - sliceY, 1);

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
