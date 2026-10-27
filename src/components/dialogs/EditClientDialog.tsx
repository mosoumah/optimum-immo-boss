import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { handleSubscriptionExpiredMessage } from "@/lib/planLimitToast";

interface Client {
  id: string;
  nom: string;
  email: string | null;
  telephone: string | null;
}

interface EditClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
  onSuccess: () => void;
}

export const EditClientDialog = ({ open, onOpenChange, client, onSuccess }: EditClientDialogProps) => {
  const navigate = useNavigate();
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (client) {
      setNom(client.nom);
      setTelephone(client.telephone || "");
      setEmail(client.email || "");
    }
  }, [client]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim() || !client) {
      toast.error("Le nom est requis");
      return;
    }

    setIsLoading(true);
    const { error } = await supabase
      .from("clients")
      .update({
        nom: nom.trim(),
        telephone: telephone.trim() || null,
        email: email.trim() || null,
      })
      .eq("id", client.id);

    setIsLoading(false);

    if (error) {
      // Abonnement expiré : le serveur refuse toute écriture (lecture seule).
      if (handleSubscriptionExpiredMessage(error.message, { toastSonner: toast, navigate })) return;
      toast.error("Erreur lors de la modification du client");
      return;
    }

    toast.success("Client modifié avec succès");
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier le client</DialogTitle>
          <DialogDescription>Modifiez les informations du client.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nom">Nom *</Label>
            <Input
              id="nom"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Nom du client"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telephone">Téléphone</Label>
            <Input
              id="telephone"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              placeholder="Numéro de téléphone"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Adresse email"
            />
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sticky bottom-0 -mx-5 -mb-5 mt-2 border-t border-border/40 bg-background/95 px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:static sm:mx-0 sm:mb-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 [&>*]:w-full sm:[&>*]:w-auto">
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
