import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Eraser, Check, Upload, PenTool } from "lucide-react";

interface SignaturePadProps {
  currentSignature: string | null;
  onSignatureSave: (dataUrl: string) => void;
}

export const SignaturePad = ({ currentSignature, onSignatureSave }: SignaturePadProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mode, setMode] = useState<"view" | "draw" | "upload">("view");
  const [hasStrokes, setHasStrokes] = useState(false);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1a1a2e";
    ctx.lineWidth = 2.5;
    setHasStrokes(false);
  }, []);

  useEffect(() => {
    if (mode === "draw") {
      setTimeout(initCanvas, 50);
    }
  }, [mode, initCanvas]);

  const getPosition = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const pos = getPosition(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const pos = getPosition(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasStrokes(true);
  };

  const stopDraw = () => setIsDrawing(false);

  const clearCanvas = () => {
    initCanvas();
  };

  const saveDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasStrokes) return;
    const dataUrl = canvas.toDataURL("image/png");
    onSignatureSave(dataUrl);
    setMode("view");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      onSignatureSave(reader.result as string);
      setMode("view");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Signature</Label>
      <p className="text-xs text-muted-foreground">
        Votre signature apparaîtra automatiquement sur tous vos documents
      </p>

      {mode === "view" && (
        <div className="space-y-3">
          {currentSignature ? (
            <div className="border border-border/50 rounded-xl p-4 bg-muted/20 flex items-center justify-center">
              <img
                src={currentSignature}
                alt="Signature actuelle"
                className="max-h-20 object-contain"
              />
            </div>
          ) : (
            <div className="border border-dashed border-border/50 rounded-xl p-6 text-center text-xs text-muted-foreground">
              Aucune signature enregistrée
            </div>
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setMode("draw")}
              className="flex-1"
            >
              <PenTool className="w-4 h-4 mr-2" />
              Dessiner
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setMode("upload")}
              className="flex-1"
            >
              <Upload className="w-4 h-4 mr-2" />
              Importer
            </Button>
          </div>
        </div>
      )}

      {mode === "draw" && (
        <div className="space-y-3">
          <canvas
            ref={canvasRef}
            className="w-full h-32 border border-border rounded-xl cursor-crosshair bg-white touch-none"
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={stopDraw}
          />
          <div className="flex gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={clearCanvas}>
              <Eraser className="w-4 h-4 mr-2" />
              Effacer
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setMode("view")}>
              Annuler
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={saveDrawing}
              disabled={!hasStrokes}
              className="ml-auto"
            >
              <Check className="w-4 h-4 mr-2" />
              Valider
            </Button>
          </div>
        </div>
      )}

      {mode === "upload" && (
        <div className="space-y-3">
          <label className="flex flex-col items-center justify-center border border-dashed border-border/50 rounded-xl p-6 cursor-pointer hover:bg-muted/20 transition-colors">
            <Upload className="w-8 h-8 text-muted-foreground mb-2" />
            <span className="text-xs text-muted-foreground">PNG ou JPG</span>
            <input
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
          <Button type="button" variant="ghost" size="sm" onClick={() => setMode("view")}>
            Annuler
          </Button>
        </div>
      )}
    </div>
  );
};
