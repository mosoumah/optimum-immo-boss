import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RevenuDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entrepriseId: string;
  onSuccess: () => void;
}

export const RevenuDialog = ({ open, onOpenChange, entrepriseId, onSuccess }: RevenuDialogProps) => {
  const [source, setSource] = useState("");
  const [montant, setMontant] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!montant || !source.trim()) {
      toast.error("Source et montant sont requis");
      return;
    }

    setIsLoading(true);

    // First create a facture as reference (required by database schema)
    const { data: factureData, error: factureError } = await supabase
      .from("factures")
      .insert({
        description: source.trim(),
        montant: parseFloat(montant),
        date: format(date, "yyyy-MM-dd"),
        entreprise_id: entrepriseId,
        statut: "paye",
        client_id: null, // Will need a default client
      })
      .select("id")
      .single();

    // If facture creation fails due to client_id constraint, we need to create differently
    // For manual revenue, we'll create a special "manual" entry
    if (factureError) {
      // Get or create a default client for manual entries
      const { data: clients } = await supabase
        .from("clients")
        .select("id")
        .eq("entreprise_id", entrepriseId)
        .limit(1);

      let clientId = clients?.[0]?.id;

      if (!clientId) {
        // Create a default client
        const { data: newClient, error: clientError } = await supabase
          .from("clients")
          .insert({
            nom: "Revenu manuel",
            entreprise_id: entrepriseId,
          })
          .select("id")
          .single();

        if (clientError) {
          toast.error("Erreur lors de la création du revenu");
          setIsLoading(false);
          return;
        }
        clientId = newClient.id;
      }

      // Create facture with client
      const { data: newFacture, error: newFactureError } = await supabase
        .from("factures")
        .insert({
          description: source.trim(),
          montant: parseFloat(montant),
          date: format(date, "yyyy-MM-dd"),
          entreprise_id: entrepriseId,
          statut: "paye",
          client_id: clientId,
        })
        .select("id")
        .single();

      if (newFactureError) {
        toast.error("Erreur lors de la création du revenu");
        setIsLoading(false);
        return;
      }

      // Insert revenue entry (trigger should handle this but we make sure)
      const { error: revenuError } = await supabase.from("revenus").insert({
        facture_id: newFacture.id,
        montant: parseFloat(montant),
        date: format(date, "yyyy-MM-dd"),
        entreprise_id: entrepriseId,
      });

      if (revenuError) {
        console.log("Revenue may have been created by trigger");
      }
    } else {
      // Revenue should be auto-created by trigger since status is 'paye'
      // But we verify
      const { error: revenuError } = await supabase.from("revenus").insert({
        facture_id: factureData.id,
        montant: parseFloat(montant),
        date: format(date, "yyyy-MM-dd"),
        entreprise_id: entrepriseId,
      });

      if (revenuError) {
        console.log("Revenue may have been created by trigger");
      }
    }

    setIsLoading(false);
    toast.success("Revenu ajouté avec succès");
    setSource("");
    setMontant("");
    setDate(new Date());
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouveau revenu</DialogTitle>
          <DialogDescription>Enregistrez un encaissement manuel.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="source">Source du revenu *</Label>
            <Textarea
              id="source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="Ex: Paiement location, Commission vente..."
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="montant">Montant (GNF) *</Label>
            <Input
              id="montant"
              type="number"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              placeholder="0"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(date, "PPP", { locale: fr })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
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
