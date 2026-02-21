import { useState, useEffect } from "react";
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

interface BienDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property?: any | null;
  onSuccess: () => void;
}

export const BienDialog = ({ open, onOpenChange, property, onSuccess }: BienDialogProps) => {
  const { toast } = useToast();
  const { entrepriseId } = useEntreprise();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    } else {
      setForm({ nom: "", adresse: "", type_bien: "appartement", surface: "", prix: "", statut: "disponible", description: "", nombre_pieces: "" });
    }
  }, [property, open]);

  const handleSubmit = async () => {
    if (!form.nom || !entrepriseId) return;
    setIsSubmitting(true);

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

    const { error } = property
      ? await supabase.from("properties").update(payload).eq("id", property.id)
      : await supabase.from("properties").insert(payload);

    setIsSubmitting(false);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Succès", description: property ? "Bien modifié" : "Bien créé" });
      onOpenChange(false);
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{property ? "Modifier le bien" : "Nouveau bien"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
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
