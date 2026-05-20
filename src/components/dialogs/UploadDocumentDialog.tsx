import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UploadDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entrepriseId: string;
  onSuccess: () => void;
}

const DOCUMENT_TYPES = [
  "Attestation de domiciliation",
  "Contrat de bail",
  "Quittance de loyer",
  "Procuration",
  "État des lieux",
  "Mandat de gestion",
  "Certificat de propriété",
  "Autre",
];

export const UploadDocumentDialog = ({
  open,
  onOpenChange,
  entrepriseId,
  onSuccess,
}: UploadDocumentDialogProps) => {
  const [type, setType] = useState("");
  const [contenu, setContenu] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".txt")) {
      toast.error("Seuls les fichiers .txt sont acceptés");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setContenu(reader.result as string);
      toast.success("Contenu importé");
    };
    reader.readAsText(file);
  };

  const handleSave = async () => {
    if (!type || !contenu.trim()) {
      toast.error("Veuillez remplir le type et le contenu");
      return;
    }
    setIsSaving(true);
    const { error } = await supabase.from("documents").insert({
      entreprise_id: entrepriseId,
      type,
      contenu: contenu.trim(),
    });
    setIsSaving(false);
    if (error) {
      toast.error("Erreur lors de l'enregistrement");
      return;
    }
    toast.success("Document importé avec succès — votre charte graphique a été appliquée");
    setType("");
    setContenu("");
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Importer un document
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Collez ou importez le contenu d'un document existant. Il héritera automatiquement de votre logo, couleurs et signature.
          </p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label>Type de document</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un type" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Contenu du document</Label>
            <Textarea
              value={contenu}
              onChange={(e) => setContenu(e.target.value)}
              placeholder="Collez le texte de votre document ici..."
              className="min-h-[200px] font-mono text-sm"
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Ou importez un fichier .txt</Label>
            <label className="flex items-center gap-3 border border-dashed border-border/50 rounded-lg p-3 cursor-pointer hover:bg-muted/20 transition-colors mt-1">
              <FileText className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Choisir un fichier .txt</span>
              <input
                type="file"
                accept=".txt"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSave} disabled={isSaving || !type || !contenu.trim()}>
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
            Importer & appliquer ma charte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
