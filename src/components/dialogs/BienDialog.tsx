import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useEntreprise } from "@/hooks/useEntreprise";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ImagePlus, X } from "lucide-react";

interface BienDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property?: any | null;
  onSuccess: () => void;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

const resizeImage = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const maxWidth = 1200;
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas context error"));
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Blob error"))),
        "image/jpeg",
        0.85
      );
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

export const BienDialog = ({ open, onOpenChange, property, onSuccess }: BienDialogProps) => {
  const { toast } = useToast();
  const { entrepriseId } = useEntreprise();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);

  const [form, setForm] = useState({
    nom: "",
    adresse: "",
    type_bien: "appartement",
    surface: "",
    prix: "",
    statut: "disponible",
    description: "",
    nombre_pieces: "",
  });

  useEffect(() => {
    if (property) {
      setForm({
        nom: property.nom || "",
        adresse: property.adresse || "",
        type_bien: property.type_bien || "appartement",
        surface: property.surface?.toString() || "",
        prix: property.prix?.toString() || "",
        statut: property.statut || "disponible",
        description: property.description || "",
        nombre_pieces: property.nombre_pieces?.toString() || "",
      });
      setPreviewUrl(property.cover_image_url || null);
    } else {
      setForm({ nom: "", adresse: "", type_bien: "appartement", surface: "", prix: "", statut: "disponible", description: "", nombre_pieces: "" });
      setPreviewUrl(null);
    }
    setSelectedFile(null);
    setRemoveImage(false);
  }, [property, open]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast({ title: "Erreur", description: "L'image ne doit pas dépasser 2 Mo", variant: "destructive" });
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setRemoveImage(false);
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setRemoveImage(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadImage = async (propertyId: string) => {
    if (!entrepriseId || !selectedFile) return null;
    const blob = await resizeImage(selectedFile);
    const filePath = `${entrepriseId}/${propertyId}.jpg`;

    // Remove old file if exists (ignore errors)
    await supabase.storage.from("property-covers").remove([filePath]);

    const { error } = await supabase.storage.from("property-covers").upload(filePath, blob, {
      contentType: "image/jpeg",
      upsert: true,
    });
    if (error) throw error;

    const { data: urlData } = supabase.storage.from("property-covers").getPublicUrl(filePath);
    return urlData.publicUrl + "?t=" + Date.now();
  };

  const handleSubmit = async () => {
    if (!form.nom || !entrepriseId) return;
    setIsSubmitting(true);

    try {
      const payload = {
        entreprise_id: entrepriseId,
        created_by: user?.id || null,
        nom: form.nom,
        adresse: form.adresse || null,
        type_bien: form.type_bien,
        surface: form.surface ? parseFloat(form.surface) : null,
        prix: form.prix ? parseFloat(form.prix) : 0,
        statut: form.statut,
        description: form.description || null,
        nombre_pieces: form.nombre_pieces ? parseInt(form.nombre_pieces) : null,
      };

      let propertyId = property?.id;

      if (property) {
        const { error } = await supabase.from("properties").update(payload).eq("id", property.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("properties").insert(payload).select("id").single();
        if (error) throw error;
        propertyId = data.id;
      }

      // Handle image upload/removal
      if (selectedFile && propertyId) {
        const imageUrl = await uploadImage(propertyId);
        if (imageUrl) {
          await supabase.from("properties").update({ cover_image_url: imageUrl }).eq("id", propertyId);
        }
      } else if (removeImage && propertyId && property?.cover_image_url) {
        const filePath = `${entrepriseId}/${propertyId}.jpg`;
        await supabase.storage.from("property-covers").remove([filePath]);
        await supabase.from("properties").update({ cover_image_url: null }).eq("id", propertyId);
      }

      toast({ title: "Succès", description: property ? "Bien modifié" : "Bien créé" });
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{property ? "Modifier le bien" : "Nouveau bien"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Image upload */}
          <div>
            <Label>Image de couverture</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            {previewUrl ? (
              <div className="relative mt-2 rounded-lg overflow-hidden">
                <img src={previewUrl} alt="Aperçu" className="w-full h-40 object-cover rounded-lg" />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 p-1 rounded-full bg-background/80 hover:bg-background text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 w-full h-32 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 transition-colors"
              >
                <ImagePlus className="w-6 h-6" />
                <span className="text-sm">Ajouter une image (max 2 Mo)</span>
              </button>
            )}
            {previewUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-1"
                onClick={() => fileInputRef.current?.click()}
              >
                Remplacer l'image
              </Button>
            )}
          </div>

          <div>
            <Label>Nom du bien *</Label>
            <Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder="Ex: Appartement T3 Centre" />
          </div>
          <div>
            <Label>Adresse</Label>
            <Input value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Type de bien</Label>
              <Select value={form.type_bien} onValueChange={(v) => setForm({ ...form, type_bien: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="appartement">Appartement</SelectItem>
                  <SelectItem value="maison">Maison</SelectItem>
                  <SelectItem value="terrain">Terrain</SelectItem>
                  <SelectItem value="bureau">Bureau</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Statut</Label>
              <Select value={form.statut} onValueChange={(v) => setForm({ ...form, statut: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="disponible">Disponible</SelectItem>
                  <SelectItem value="reserve">Réservé</SelectItem>
                  <SelectItem value="vendu">Vendu</SelectItem>
                  <SelectItem value="loue">Loué</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Surface (m²)</Label>
              <Input type="number" value={form.surface} onChange={(e) => setForm({ ...form, surface: e.target.value })} />
            </div>
            <div>
              <Label>Prix (GNF)</Label>
              <Input type="number" value={form.prix} onChange={(e) => setForm({ ...form, prix: e.target.value })} />
            </div>
            <div>
              <Label>Pièces</Label>
              <Input type="number" value={form.nombre_pieces} onChange={(e) => setForm({ ...form, nombre_pieces: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
          </div>
          <Button onClick={handleSubmit} disabled={isSubmitting || !form.nom} className="w-full">
            {isSubmitting ? "Enregistrement..." : property ? "Modifier" : "Créer le bien"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
