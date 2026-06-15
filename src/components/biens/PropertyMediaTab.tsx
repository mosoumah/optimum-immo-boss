import { useRef, useState } from "react";
import { ImagePlus, FileText, Film, X, Star, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { usePropertyMedia, type PropertyMediaItem } from "@/hooks/usePropertyMedia";

const MAX_IMG = 5 * 1024 * 1024;
const MAX_PDF = 10 * 1024 * 1024;
const MAX_VID = 50 * 1024 * 1024;

const formatSize = (bytes: number | null) => {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
};

interface PropertyMediaTabProps {
  propertyId: string;
  entrepriseId: string;
  videoUrl: string;
  onVideoUrlChange: (v: string) => void;
}

export const PropertyMediaTab = ({ propertyId, entrepriseId, videoUrl, onVideoUrlChange }: PropertyMediaTabProps) => {
  const { toast } = useToast();
  const { media, isLoading, refresh } = usePropertyMedia(propertyId);
  const [uploading, setUploading] = useState(false);
  const imgInput = useRef<HTMLInputElement>(null);
  const pdfInput = useRef<HTMLInputElement>(null);
  const vidInput = useRef<HTMLInputElement>(null);

  const images = media.filter((m) => m.media_type === "image");
  const docs = media.filter((m) => m.media_type === "document");
  const videos = media.filter((m) => m.media_type === "video");

  const COVER_TTL = 60 * 60 * 24 * 365; // 1 an

  const uploadFiles = async (
    files: FileList,
    bucket: "property-gallery" | "property-documents" | "property-videos",
    type: "image" | "document" | "video",
    maxSize: number
  ) => {
    setUploading(true);
    try {
      const list = Array.from(files);
      const valid: File[] = [];
      for (const file of list) {
        if (file.size > maxSize) {
          toast({
            title: "Fichier trop volumineux",
            description: `${file.name} dépasse la limite (${(maxSize / 1024 / 1024).toFixed(0)} Mo)`,
            variant: "destructive",
          });
          continue;
        }
        valid.push(file);
      }

      const hasCoverAlready = media.some((m) => m.media_type === "image" && m.is_cover);
      let firstImagePath: string | null = null;

      const uploadOne = async (file: File, index: number) => {
        const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
        const path = `${entrepriseId}/${propertyId}/${Date.now()}_${index}_${safeName}`;
        const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, {
          contentType: file.type,
          upsert: false,
        });
        if (upErr) throw upErr;

        const isCover = type === "image" && !hasCoverAlready && index === 0;
        if (isCover) firstImagePath = path;

        const { error: insErr } = await supabase.from("property_media").insert({
          property_id: propertyId,
          entreprise_id: entrepriseId,
          media_type: type,
          bucket,
          storage_path: path,
          nom_fichier: file.name,
          taille_octets: file.size,
          is_cover: isCover,
        });
        if (insErr) throw insErr;
      };

      // Uploads en parallèle pour accélérer l'affichage
      await Promise.all(valid.map((f, i) => uploadOne(f, i)));

      // Si on vient de définir la couverture automatiquement, on l'écrit dans properties
      if (firstImagePath) {
        const { data: signed } = await supabase.storage
          .from(bucket)
          .createSignedUrl(firstImagePath, COVER_TTL);
        if (signed?.signedUrl) {
          await supabase.from("properties").update({ cover_image_url: signed.signedUrl }).eq("id", propertyId);
        }
      }

      await refresh();
      toast({ title: "Téléversement réussi" });
    } catch (e) {
      toast({
        title: "Erreur",
        description: e instanceof Error ? e.message : "Échec du téléversement",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeMedia = async (m: PropertyMediaItem) => {
    try {
      await supabase.storage.from(m.bucket).remove([m.storage_path]);
      await supabase.from("property_media").delete().eq("id", m.id);
      if (m.is_cover) {
        await supabase.from("properties").update({ cover_image_url: null }).eq("id", propertyId);
      }
      await refresh();
      toast({ title: "Supprimé" });
    } catch (e) {
      toast({
        title: "Erreur",
        description: e instanceof Error ? e.message : "Échec de la suppression",
        variant: "destructive",
      });
    }
  };

  const setCover = async (m: PropertyMediaItem) => {
    try {
      // Démarquer les autres couvertures
      await supabase
        .from("property_media")
        .update({ is_cover: false })
        .eq("property_id", propertyId)
        .eq("media_type", "image");

      const { error } = await supabase
        .from("property_media")
        .update({ is_cover: true })
        .eq("id", m.id);
      if (error) throw error;

      // URL signée longue durée pour l'affichage en liste/détail
      const { data: signed } = await supabase.storage
        .from(m.bucket)
        .createSignedUrl(m.storage_path, COVER_TTL);
      if (signed?.signedUrl) {
        await supabase.from("properties").update({ cover_image_url: signed.signedUrl }).eq("id", propertyId);
      }
      await refresh();
      toast({ title: "Image principale mise à jour" });
    } catch (e) {
      toast({
        title: "Erreur",
        description: e instanceof Error ? e.message : "Échec",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Galerie images */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <Label className="text-base font-semibold">Galerie ({images.length})</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => imgInput.current?.click()}
            disabled={uploading}
          >
            <ImagePlus className="w-4 h-4 mr-1" /> Ajouter
          </Button>
          <input
            ref={imgInput}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) uploadFiles(e.target.files, "property-gallery", "image", MAX_IMG);
              e.target.value = "";
            }}
          />
        </div>
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        ) : images.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune image. Max 5 Mo par fichier.</p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {images.map((m) => (
              <div key={m.id} className="relative group rounded-lg overflow-hidden border border-border/40">
                {m.signedUrl && (
                  <img src={m.signedUrl} alt={m.nom_fichier} className="w-full h-24 object-cover" />
                )}
                {m.is_cover && (
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-primary text-primary-foreground text-[10px] font-medium flex items-center gap-1">
                    <Star className="w-3 h-3" /> Principale
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                  {!m.is_cover && (
                    <button
                      type="button"
                      onClick={() => setCover(m)}
                      className="p-1.5 rounded bg-white/20 hover:bg-white/30 text-white"
                      title="Définir comme principale"
                    >
                      <Star className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeMedia(m)}
                    className="p-1.5 rounded bg-destructive/80 hover:bg-destructive text-white"
                    title="Supprimer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Vidéo */}
      <section className="space-y-3">
        <Label className="text-base font-semibold">Vidéo</Label>
        <div>
          <Label className="text-xs text-muted-foreground">URL YouTube / Vimeo</Label>
          <Input
            value={videoUrl}
            onChange={(e) => onVideoUrlChange(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Ou téléverser ({videos.length}) — max 50 Mo</span>
          <Button type="button" size="sm" variant="outline" onClick={() => vidInput.current?.click()} disabled={uploading}>
            <Upload className="w-4 h-4 mr-1" /> Vidéo
          </Button>
          <input
            ref={vidInput}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) uploadFiles(e.target.files, "property-videos", "video", MAX_VID);
              e.target.value = "";
            }}
          />
        </div>
        {videos.length > 0 && (
          <div className="space-y-2">
            {videos.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-2 rounded border border-border/40 bg-secondary/20">
                <div className="flex items-center gap-2 min-w-0">
                  <Film className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-sm truncate">{m.nom_fichier}</span>
                  <span className="text-xs text-muted-foreground">{formatSize(m.taille_octets)}</span>
                </div>
                <Button type="button" size="sm" variant="ghost" onClick={() => removeMedia(m)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Documents */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Documents ({docs.length})</Label>
          <Button type="button" size="sm" variant="outline" onClick={() => pdfInput.current?.click()} disabled={uploading}>
            <Upload className="w-4 h-4 mr-1" /> PDF
          </Button>
          <input
            ref={pdfInput}
            type="file"
            accept="application/pdf"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) uploadFiles(e.target.files, "property-documents", "document", MAX_PDF);
              e.target.value = "";
            }}
          />
        </div>
        {docs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun document. Max 10 Mo par fichier (contrats, titre foncier, plans…).</p>
        ) : (
          <div className="space-y-2">
            {docs.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-2 rounded border border-border/40 bg-secondary/20">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-sm truncate">{m.nom_fichier}</span>
                  <span className="text-xs text-muted-foreground">{formatSize(m.taille_octets)}</span>
                </div>
                <Button type="button" size="sm" variant="ghost" onClick={() => removeMedia(m)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
