import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Client {
  id: string;
  nom: string;
}

interface DocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entrepriseId: string;
  onSuccess: () => void;
}

const documentTypes = [
  "Contrat",
  "Attestation",
  "Courrier",
  "Rapport",
  "Note de service",
  "Autre",
];

export const DocumentDialog = ({ open, onOpenChange, entrepriseId, onSuccess }: DocumentDialogProps) => {
  const [type, setType] = useState("");
  const [contenu, setContenu] = useState("");
  const [clientId, setClientId] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchClients = async () => {
      const { data } = await supabase
        .from("clients")
        .select("id, nom")
        .eq("entreprise_id", entrepriseId)
        .order("nom");
      setClients(data || []);
    };

    if (open && entrepriseId) {
      fetchClients();
    }
  }, [open, entrepriseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!type) {
      toast.error("Le type de document est requis");
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.from("documents").insert({
      type,
      contenu: contenu.trim() || null,
      client_id: clientId || null,
      entreprise_id: entrepriseId,
    });

    setIsLoading(false);

    if (error) {
      toast.error("Erreur lors de la création du document");
      return;
    }

    toast.success("Document créé avec succès");
    setType("");
    setContenu("");
    setClientId("");
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouveau document</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Type de document *</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Client (optionnel)</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Aucun client</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contenu">Contenu</Label>
            <Textarea
              id="contenu"
              value={contenu}
              onChange={(e) => setContenu(e.target.value)}
              placeholder="Contenu du document"
              rows={6}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
