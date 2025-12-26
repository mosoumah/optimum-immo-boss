import { useState, useRef } from "react";
import { Upload, Image, Loader2, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LogoUploadProps {
  entrepriseId: string;
  currentLogo: string | null;
  onLogoUpdated: (newLogoUrl: string, colors?: { couleur_primaire: string; couleur_secondaire: string; couleur_accent: string }) => void;
  currentColors?: {
    couleur_primaire: string | null;
    couleur_secondaire: string | null;
    couleur_accent: string | null;
  };
}

export const LogoUpload = ({ entrepriseId, currentLogo, onLogoUpdated, currentColors }: LogoUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const analyzeLogoColors = async (logoUrl: string) => {
    setIsAnalyzing(true);
    try {
      const response = await supabase.functions.invoke("analyze-logo", {
        body: { logoUrl },
      });

      if (response.error) {
        console.error("Error analyzing logo:", response.error);
        toast.error("Erreur lors de l'analyse des couleurs");
        return null;
      }

      const colors = response.data;
      
      if (colors.couleur_primaire && colors.couleur_secondaire && colors.couleur_accent) {
        // Update entreprise with colors
        const { error: updateError } = await supabase
          .from("entreprises")
          .update({
            couleur_primaire: colors.couleur_primaire,
            couleur_secondaire: colors.couleur_secondaire,
            couleur_accent: colors.couleur_accent,
          })
          .eq("id", entrepriseId);

        if (updateError) {
          console.error("Error updating colors:", updateError);
          toast.error("Erreur lors de la sauvegarde des couleurs");
        } else {
          toast.success("Charte graphique extraite avec succès!");
        }
        
        return colors;
      }
      
      return null;
    } catch (error) {
      console.error("Logo analysis error:", error);
      toast.error("Erreur lors de l'analyse du logo");
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner une image (PNG, JPG, etc.)");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 2 Mo");
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${entrepriseId}/logo-${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("logos")
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        toast.error("Erreur lors de l'upload: " + uploadError.message);
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("logos")
        .getPublicUrl(fileName);

      const logoUrl = `${urlData.publicUrl}?v=${Date.now()}`;

      // Update entreprise with logo URL
      const { error: updateError } = await supabase
        .from("entreprises")
        .update({ logo: logoUrl })
        .eq("id", entrepriseId);

      if (updateError) {
        console.error("Update error:", updateError);
        toast.error("Erreur lors de la mise à jour: " + updateError.message);
        return;
      }

      toast.success("Logo mis à jour avec succès");
      
      // Analyze logo colors with AI
      const colors = await analyzeLogoColors(logoUrl);
      onLogoUpdated(logoUrl, colors || undefined);
      
    } catch (error) {
      console.error("Logo upload error:", error);
      toast.error("Erreur inattendue lors de l'upload");
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleReanalyze = async () => {
    if (!currentLogo) {
      toast.error("Aucun logo à analyser");
      return;
    }
    const colors = await analyzeLogoColors(currentLogo);
    if (colors) {
      onLogoUpdated(currentLogo, colors);
    }
  };

  const isProcessing = isUploading || isAnalyzing;

  return (
    <div className="p-4 rounded-xl border border-border/50 bg-secondary/20 space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-background overflow-hidden">
          {currentLogo ? (
            <img
              src={currentLogo}
              alt="Logo entreprise"
              className="w-full h-full object-contain"
            />
          ) : (
            <Image className="w-6 h-6 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm">Logo de l'entreprise</p>
          <p className="text-xs text-muted-foreground">
            {isAnalyzing 
              ? "Analyse IA en cours..." 
              : isUploading 
                ? "Upload en cours..." 
                : currentLogo 
                  ? "Cliquez pour remplacer" 
                  : "Aucun logo configuré"}
          </p>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="hidden"
            id="logo-upload"
          />
          <label htmlFor="logo-upload">
            <Button
              variant="outline"
              size="sm"
              disabled={isProcessing}
              asChild
            >
              <span className="cursor-pointer">
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    {currentLogo ? "Remplacer" : "Importer"}
                  </>
                )}
              </span>
            </Button>
          </label>
          {currentLogo && !isProcessing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReanalyze}
              title="Réanalyser les couleurs"
            >
              <Palette className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Color palette preview */}
      {currentColors && (currentColors.couleur_primaire || currentColors.couleur_secondaire || currentColors.couleur_accent) && (
        <div className="flex items-center gap-3 pt-2 border-t border-border/30">
          <span className="text-xs text-muted-foreground">Charte graphique:</span>
          <div className="flex gap-2">
            {currentColors.couleur_primaire && (
              <div 
                className="w-6 h-6 rounded-full border border-border shadow-sm" 
                style={{ backgroundColor: currentColors.couleur_primaire }}
                title={`Primaire: ${currentColors.couleur_primaire}`}
              />
            )}
            {currentColors.couleur_secondaire && (
              <div 
                className="w-6 h-6 rounded-full border border-border shadow-sm" 
                style={{ backgroundColor: currentColors.couleur_secondaire }}
                title={`Secondaire: ${currentColors.couleur_secondaire}`}
              />
            )}
            {currentColors.couleur_accent && (
              <div 
                className="w-6 h-6 rounded-full border border-border shadow-sm" 
                style={{ backgroundColor: currentColors.couleur_accent }}
                title={`Accent: ${currentColors.couleur_accent}`}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
