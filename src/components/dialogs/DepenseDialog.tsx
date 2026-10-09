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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DepenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entrepriseId: string;
  onSuccess: () => void;
}

const typesDepense = [
  "Loyer bureau",
  "Électricité",
  "Internet / Téléphone",
  "Fournitures bureau",
  "Transport / Carburant",
  "Marketing / Publicité",
  "Salaires / Personnel",
  "Maintenance",
  "Frais bancaires",
  "Taxes / Impôts",
  "Autre",
];

export const DepenseDialog = ({ open, onOpenChange, entrepriseId, onSuccess }: DepenseDialogProps) => {
  const [typeDepense, setTypeDepense] = useState("");
  const [description, setDescription] = useState("");
  const [montant, setMontant] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!montant || !typeDepense) {
      toast.error("Type et montant sont requis");
      return;
    }
    if (parseFloat(montant) <= 0) {
      toast.error("Le montant doit être supérieur à 0");
      return;
    }

    const fullDescription = description.trim() 
      ? `${typeDepense} - ${description.trim()}`
      : typeDepense;

    setIsLoading(true);
    const { error } = await supabase.from("depenses").insert({
      description: fullDescription,
      montant: parseFloat(montant),
      date: format(date, "yyyy-MM-dd"),
      entreprise_id: entrepriseId,
    });

    setIsLoading(false);

    if (error) {
      toast.error("Erreur lors de la création de la dépense");
      return;
    }

    toast.success("Dépense ajoutée avec succès");
    setTypeDepense("");
    setDescription("");
    setMontant("");
    setDate(new Date());
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvelle dépense</DialogTitle>
          <DialogDescription>Enregistrez une nouvelle dépense.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type de dépense *</Label>
            <Select value={typeDepense} onValueChange={setTypeDepense}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un type" />
              </SelectTrigger>
              <SelectContent>
                {typesDepense.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Commentaire</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Détails supplémentaires (optionnel)"
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
