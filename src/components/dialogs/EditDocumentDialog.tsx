import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Pencil } from "lucide-react";

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

interface EditDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: {
    id: string;
    type: string;
    contenu: string | null;
  } | null;
  onSuccess: () => void;
}

export const EditDocumentDialog = ({ open, onOpenChange, document, onSuccess }: EditDocumentDialogProps) => {
  const [type, setType] = useState("");
  const [contenu, setContenu] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && document) {
      setType(document.type);
      setContenu(document.contenu || "");
    }
  }, [open, document]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!document) return;

    setIsLoading(true);
    const { error } = await supabase
      .from("documents")
      .update({ type, contenu: contenu.trim() || null })
      .eq("id", document.id);

    setIsLoading(false);

    if (error) {
      toast.error("Erreur lors de la mise à jour du document");
      return;
    }

    toast.success("Document mis à jour avec succès");
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="w-5 h-5 text-primary" />
            Modifier le document
          </DialogTitle>
          <DialogDescription>Modifiez le type ou le contenu du document.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Type de document</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-contenu">Contenu du document</Label>
            <Textarea
              id="edit-contenu"
              value={contenu}
              onChange={(e) => setContenu(e.target.value)}
              placeholder="Contenu du document"
              rows={16}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                "Enregistrer"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
