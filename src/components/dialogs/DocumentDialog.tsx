import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, Loader2 } from "lucide-react";

interface Client {
  id: string;
  nom: string;
}

interface Entreprise {
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
  "Contrat de bail",
  "Contrat de vente",
  "Attestation de domicile",
  "Procuration",
  "Quittance de loyer",
  "État des lieux",
  "Lettre de résiliation",
  "Courrier de relance",
  "Mandat de gestion",
  "Compromis de vente",
  "Autre",
];

export const DocumentDialog = ({ open, onOpenChange, entrepriseId, onSuccess }: DocumentDialogProps) => {
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [contenu, setContenu] = useState("");
  const [clientId, setClientId] = useState("");
  const [localisation, setLocalisation] = useState("");
  const [details, setDetails] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [entreprise, setEntreprise] = useState<Entreprise | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [clientsRes, entrepriseRes] = await Promise.all([
        supabase
          .from("clients")
          .select("id, nom")
          .eq("entreprise_id", entrepriseId)
          .order("nom"),
        supabase
          .from("entreprises")
          .select("id, nom")
          .eq("id", entrepriseId)
          .maybeSingle()
      ]);
      
      setClients(clientsRes.data || []);
      setEntreprise(entrepriseRes.data);
    };

    if (open && entrepriseId) {
      fetchData();
    }
  }, [open, entrepriseId]);

  const selectedClient = clients.find(c => c.id === clientId);

  const handleGenerate = async () => {
    if (!type) {
      toast.error("Sélectionnez un type de document");
      return;
    }

    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-document', {
        body: {
          entrepriseNom: entreprise?.nom,
          typeDocument: type,
          description: description,
          clientNom: selectedClient?.nom,
          localisation: localisation,
          details: details,
        }
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setContenu(data.content);
      toast.success("Document généré avec succès !");
    } catch (error) {
      console.error("Erreur génération:", error);
      toast.error("Erreur lors de la génération du document");
    } finally {
      setIsGenerating(false);
    }
  };

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
    resetForm();
    onOpenChange(false);
    onSuccess();
  };

  const resetForm = () => {
    setType("");
    setDescription("");
    setContenu("");
    setClientId("");
    setLocalisation("");
    setDetails("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Nouveau document IA
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
              <Select value={clientId} onValueChange={(val) => setClientId(val === "none" ? "" : val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun client</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description du besoin</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez le document souhaité (ex: Contrat de bail pour un appartement 3 pièces...)"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="localisation">Localisation</Label>
              <Input
                id="localisation"
                value={localisation}
                onChange={(e) => setLocalisation(e.target.value)}
                placeholder="Ex: Kaloum, Conakry"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="details">Montant / Durée / Conditions</Label>
              <Input
                id="details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Ex: 5 000 000 GNF/mois, 12 mois"
              />
            </div>
          </div>

          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={handleGenerate}
              disabled={isGenerating || !type}
              className="w-full border-primary/50 hover:bg-primary/10"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Générer avec l'IA
                </>
              )}
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contenu">Contenu du document</Label>
            <Textarea
              id="contenu"
              value={contenu}
              onChange={(e) => setContenu(e.target.value)}
              placeholder="Le contenu sera généré par l'IA ou vous pouvez le saisir manuellement"
              rows={12}
              className="font-mono text-sm"
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
