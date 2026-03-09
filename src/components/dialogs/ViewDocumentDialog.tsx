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
    minY: number,
    aggressiveMinY: number
  ): number => {
    const width = canvas.width;
    const leftBound = Math.floor(width * 0.20);
    const rightBound = Math.floor(width * 0.80);
    const scanWidth = rightBound - leftBound;
    const bandHeight = 10; // Détection chirurgicale entre les lignes
    const halfBand = Math.floor(bandHeight / 2);

    let bestY = idealY;
    let bestDensity = Infinity;

    const startY = Math.min(idealY, canvas.height - 1);

    // Passe agressive (95% - 100%)
    const aggressiveUpperLimit = Math.max(aggressiveMinY, 1);
    // Seuil de proximité : 2% de la hauteur de page — retour immédiat seulement si très proche de l'idéal
    const nearIdealThreshold = (idealY - aggressiveMinY) * 0.4;

    for (let y = startY; y >= aggressiveUpperLimit; y--) {
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
        if (r < 240 && g < 240 && b < 240) {
          inkPixels++;
        }
      }
      const density = inkPixels / Math.max(totalPixels, 1);

      if (density < bestDensity) {
        bestDensity = density;
        bestY = y;
        // Retour immédiat seulement si on est très proche de idealY (greedy fill)
        if (density < 0.01 && (idealY - y) <= nearIdealThreshold) return y;
      }
    }

    // Passe de sauvetage (30% - 85%) si la zone agressive coupe une image (densité > 5%)
    if (bestDensity > 0.05) {
      const rescueUpperLimit = Math.max(minY, 1);
      for (let y = aggressiveUpperLimit - 1; y >= rescueUpperLimit; y--) {
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
          if (r < 240 && g < 240 && b < 240) {
            inkPixels++;
          }
        }
        const density = inkPixels / Math.max(totalPixels, 1);

        if (density < bestDensity) {
          bestDensity = density;
          bestY = y;
          if (density < 0.01) return y; // Sauvetage parfait
        }
      }
    }

    return bestY;
  };

  const collectDomBreakCandidates = (root: HTMLElement, scale: number): number[] => {
    const rootRect = root.getBoundingClientRect();
    const nodes = Array.from(root.querySelectorAll<HTMLElement>("h1, h2, h3, h4, p, li, tr, div"));
    
    // Collect absolute bottom positions of meaningful elements
    const elementEdges: { top: number; bottom: number }[] = [];

    for (const node of nodes) {
      const rect = node.getBoundingClientRect();
      const relTop = (rect.top - rootRect.top) * scale;
      const relBottom = (rect.bottom - rootRect.top) * scale;
      const height = relBottom - relTop;

      if (height < 10 || relTop <= 0) continue;
      // Skip container divs that wrap the whole document
      if (height > rootRect.height * scale * 0.5) continue;

      const text = node.innerText?.trim() || "";
      if (text.length < 10 && !node.querySelector("img")) continue;

      elementEdges.push({ top: relTop, bottom: relBottom });
    }

    // Sort by top position
    elementEdges.sort((a, b) => a.top - b.top);

    // Find gaps between consecutive elements: midpoint of (bottom_i, top_i+1)
    const candidates: number[] = [];
    for (let i = 0; i < elementEdges.length - 1; i++) {
      const gapStart = elementEdges[i].bottom;
      const gapEnd = elementEdges[i + 1].top;
      if (gapEnd > gapStart) {
        candidates.push(Math.round((gapStart + gapEnd) / 2));
      } else {
        // Elements overlap or are adjacent – use the boundary
        candidates.push(Math.round(gapStart));
      }
    }

    // Dedupe close points
    const deduped: number[] = [];
    for (const point of candidates) {
      const last = deduped[deduped.length - 1];
      if (last === undefined || Math.abs(point - last) > 20) {
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

      const domBreakCandidates = collectDomBreakCandidates(clone, 2);

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

      // Format: match a standard document PDF layout (consistent margins + stable page height)
      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

      // Page paddings to avoid edge-to-edge rendering (closer to typical PDF exports)
      const pagePaddingX = 8; // mm
      const pagePaddingTop = 8; // mm
      const pagePaddingBottom = 8; // mm
      const footerReserved = 6; // mm reserved for page number

      const contentWidth = pdfWidth - pagePaddingX * 2;
      const contentHeight = pdfHeight - pagePaddingTop - pagePaddingBottom - footerReserved;

      // Calculate the pixel height of one page based on canvas width and content area ratio
      const pageHeightPx = Math.floor((contentHeight / contentWidth) * canvas.width);

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context unavailable");

      // Minimum slice height (Rescue): 70% of a page
      const minSliceHeightPx = Math.floor(pageHeightPx * 0.70);
      // Aggressive slice height: 90% of a page
      const aggressiveSliceHeightPx = Math.floor(pageHeightPx * 0.90);

      // Calculate all page break points using DOM-aware breaks first, then pixel fallback
      const breakPoints: number[] = [0];
      let currentY = 0;
      while (currentY + pageHeightPx < canvas.height) {
        const idealBreak = currentY + pageHeightPx;
        const minBreakY = currentY + minSliceHeightPx;
        const aggressiveMinBreakY = currentY + aggressiveSliceHeightPx;

        // 1. Chercher un bon saut DOM dans la zone agressive (90% - 100%)
        const domBreakAggressive = findDomBreakPoint(domBreakCandidates, idealBreak, aggressiveMinBreakY, idealBreak);
        
        // 2. Fallback chirurgical en pixels (zone agressive 90-100%)
        const fallbackBreak = findSafeBreakPoint(canvas, ctx, idealBreak, minBreakY, aggressiveMinBreakY);

        // 3. Seulement si densité très élevée (image/tableau insécable), autoriser rescue DOM (70-90%)
        let rescueBreak: number | null = null;
        if (!domBreakAggressive && fallbackBreak < aggressiveMinBreakY) {
          // Le pixel fallback a reculé sous 90% — contenu dense détecté, chercher rescue DOM
          rescueBreak = findDomBreakPoint(domBreakCandidates, idealBreak, minBreakY, aggressiveMinBreakY);
        }

        // Priorité : DOM agressif > pixel fallback > rescue DOM
        const chosenBreak = domBreakAggressive ?? (fallbackBreak >= aggressiveMinBreakY ? fallbackBreak : (rescueBreak ?? fallbackBreak));
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

        const sliceY = breakPoints[page];
        const sliceEnd = breakPoints[page + 1];
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
        pageCtx.drawImage(canvas, 0, sliceY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);

        const sliceRatio = contentWidth / pageCanvas.width;
        // Anti-squish: Use precise proportional rendering height
        const renderedHeight = pageCanvas.height * sliceRatio;

        pdf.addImage(
          pageCanvas.toDataURL("image/png"),
          "PNG",
          pagePaddingX,
          pagePaddingTop,
          contentWidth,
          renderedHeight
        );

        // Add page number (subtle, in reserved footer area)
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(
          `Page ${page + 1} / ${totalPages}`,
          pdfWidth / 2,
          pdfHeight - pagePaddingBottom,
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
