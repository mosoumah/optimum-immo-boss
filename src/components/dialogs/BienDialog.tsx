import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useEntreprise } from "@/hooks/useEntreprise";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { PropertyMediaTab } from "@/components/biens/PropertyMediaTab";
import type { Database } from "@/integrations/supabase/types";

type Property = Database["public"]["Tables"]["properties"]["Row"];

interface BienDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property?: Property | null;
  onSuccess: () => void;
}

const defaultForm = {
  nom: "",
  type_bien: "appartement",
  statut: "disponible",
  prix: "",
  surface: "",
  nombre_pieces: "",
  adresse: "",
  quartier: "",
  commune: "",
  ville: "",
  description: "",
  description_longue: "",
  video_url: "",
};

export const BienDialog = ({ open, onOpenChange, property, onSuccess }: BienDialogProps) => {
  const { toast } = useToast();
  const { entrepriseId } = useEntreprise();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    if (property) {
      setForm({
        nom: property.nom || "",
        type_bien: property.type_bien || "appartement",
        statut: property.statut || "disponible",
        prix: property.prix?.toString() || "",
        surface: property.surface?.toString() || "",
        nombre_pieces: property.nombre_pieces?.toString() || "",
        adresse: property.adresse || "",
        quartier: property.quartier || "",
        commune: property.commune || "",
        ville: property.ville || "",
        description: property.description || "",
        description_longue: property.description_longue || "",
        video_url: property.video_url || "",
      });
      setCreatedId(property.id);
    } else {
      setForm(defaultForm);
      setCreatedId(null);
    }
  }, [property, open]);

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.nom || !entrepriseId) return;
    setIsSubmitting(true);
    try {
      const payload = {
        entreprise_id: entrepriseId,
        created_by: user?.id || null,
        nom: form.nom,
        type_bien: form.type_bien,
        statut: form.statut,
        prix: form.prix ? parseFloat(form.prix) : 0,
        surface: form.surface ? parseFloat(form.surface) : null,
        nombre_pieces: form.nombre_pieces ? parseInt(form.nombre_pieces) : null,
        adresse: form.adresse || null,
        quartier: form.quartier || null,
        commune: form.commune || null,
        ville: form.ville || null,
        description: form.description || null,
        description_longue: form.description_longue || null,
        video_url: form.video_url || null,
      };

      let id = createdId;
      if (id) {
        const { error } = await supabase.from("properties").update(payload).eq("id", id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("properties")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        id = data.id;
        setCreatedId(id);
      }

      toast({ title: "Succès", description: property || createdId ? "Bien enregistré" : "Bien créé" });
      onSuccess();
      if (!property && !createdId) {
        toast({
          title: "Astuce",
          description: "Ajoutez maintenant des photos et documents dans l'onglet Médias.",
        });
      } else {
        onOpenChange(false);
      }
    } catch (e) {
      toast({
        title: "Erreur",
        description: e instanceof Error ? e.message : "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="left-2 top-2 bottom-2 right-2 max-h-none w-auto max-w-none translate-x-0 translate-y-0 transform-none overflow-y-auto overflow-x-hidden rounded-lg p-0 !block duration-0 data-[state=closed]:animate-none data-[state=open]:animate-none sm:bottom-auto sm:right-auto sm:left-1/2 sm:top-1/2 sm:max-h-[calc(100dvh-1rem)] sm:w-[calc(100vw-2rem)] sm:max-w-3xl sm:-translate-x-1/2 sm:-translate-y-1/2">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2 shrink-0">
          <DialogTitle>{property ? "Modifier le bien" : "Nouveau bien"}</DialogTitle>
          <DialogDescription>
            Renseignez toutes les informations puis ajoutez vos médias.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full min-w-0">
          <TabsList className="mx-4 sm:mx-6 grid grid-cols-4 h-11 gap-1 p-1 shrink-0">
            <TabsTrigger value="general" className="min-w-0 px-2 py-2 text-xs sm:text-sm">Général</TabsTrigger>
            <TabsTrigger value="localisation" className="min-w-0 px-2 py-2 text-xs sm:text-sm">
              <span className="sm:hidden">Lieu</span>
              <span className="hidden sm:inline">Localisation</span>
            </TabsTrigger>
            <TabsTrigger value="description" className="min-w-0 px-2 py-2 text-xs sm:text-sm">
              <span className="sm:hidden">Desc.</span>
              <span className="hidden sm:inline">Description</span>
            </TabsTrigger>
            <TabsTrigger value="medias" disabled={!createdId} className="min-w-0 px-2 py-2 text-xs sm:text-sm">
              Médias
            </TabsTrigger>
          </TabsList>

          <div className="px-4 sm:px-6 pb-4">
          <TabsContent value="general" className="space-y-4 pt-4 mt-0">
            <div>
              <Label>Nom du bien *</Label>
              <Input value={form.nom} onChange={(e) => update("nom", e.target.value)} placeholder="Ex: Villa Almadies" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Catégorie</Label>
                <Select value={form.type_bien} onValueChange={(v) => update("type_bien", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="appartement">Appartement</SelectItem>
                    <SelectItem value="villa">Villa</SelectItem>
                    <SelectItem value="maison">Maison</SelectItem>
                    <SelectItem value="terrain">Terrain</SelectItem>
                    <SelectItem value="bureau">Bureau</SelectItem>
                    <SelectItem value="magasin">Magasin</SelectItem>
                    <SelectItem value="entrepot">Entrepôt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Statut</Label>
                <Select value={form.statut} onValueChange={(v) => update("statut", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="disponible">Disponible</SelectItem>
                    <SelectItem value="reserve">Réservé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label>Prix (GNF)</Label>
                <Input type="number" min="0" value={form.prix} onChange={(e) => update("prix", e.target.value)} />
              </div>
              <div>
                <Label>Surface (m²)</Label>
                <Input type="number" min="0" value={form.surface} onChange={(e) => update("surface", e.target.value)} />
              </div>
              <div>
                <Label>Pièces</Label>
                <Input type="number" min="0" value={form.nombre_pieces} onChange={(e) => update("nombre_pieces", e.target.value)} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="localisation" className="space-y-4 pt-4">
            <div>
              <Label>Adresse</Label>
              <Input value={form.adresse} onChange={(e) => update("adresse", e.target.value)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label>Quartier</Label>
                <Input value={form.quartier} onChange={(e) => update("quartier", e.target.value)} />
              </div>
              <div>
                <Label>Commune</Label>
                <Input value={form.commune} onChange={(e) => update("commune", e.target.value)} />
              </div>
              <div>
                <Label>Ville</Label>
                <Input value={form.ville} onChange={(e) => update("ville", e.target.value)} />
              </div>
            </div>
          </TabsContent>


          <TabsContent value="description" className="space-y-4 pt-4">
            <div>
              <Label>Description courte</Label>
              <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={2} />
            </div>
            <div>
              <Label>Description détaillée</Label>
              <Textarea
                value={form.description_longue}
                onChange={(e) => update("description_longue", e.target.value)}
                rows={8}
                placeholder="Décrivez en détail le bien, ses atouts, son environnement…"
              />
            </div>
          </TabsContent>

          <TabsContent value="medias" className="pt-4">
            {createdId && entrepriseId ? (
              <PropertyMediaTab
                propertyId={createdId}
                entrepriseId={entrepriseId}
                videoUrl={form.video_url}
                onVideoUrlChange={(v) => update("video_url", v)}
              />
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Enregistrez d'abord le bien pour ajouter des médias.
              </p>
            )}
          </TabsContent>
          </div>
        </Tabs>

        <div className="flex justify-end gap-2 px-4 sm:px-6 py-3 border-t border-border/40 bg-background">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
          <Button onClick={save} disabled={isSubmitting || !form.nom}>
            {isSubmitting ? "Enregistrement..." : property || createdId ? "Enregistrer" : "Créer le bien"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
