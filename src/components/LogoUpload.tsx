import { useState, useRef } from "react";
import { Upload, Image, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LogoUploadProps {
  entrepriseId: string;
  currentLogo: string | null;
  onLogoUpdated: (newLogoUrl: string) => void;
}

export const LogoUpload = ({ entrepriseId, currentLogo, onLogoUpdated }: LogoUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      onLogoUpdated(logoUrl);
      toast.success("Logo mis à jour avec succès");
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

  return (
    <div className="p-4 rounded-xl border border-border/50 bg-secondary/20">
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
            {currentLogo ? "Cliquez pour remplacer" : "Aucun logo configuré"}
          </p>
        </div>
        <div>
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
              disabled={isUploading}
              asChild
            >
              <span className="cursor-pointer">
                {isUploading ? (
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
        </div>
      </div>
    </div>
  );
};
