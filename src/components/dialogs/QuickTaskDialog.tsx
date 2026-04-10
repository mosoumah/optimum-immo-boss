import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, Loader2, ClipboardList, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface QuickTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assigneeId: string;
  assigneeName: string;
  entrepriseId: string;
  onSuccess: () => void;
}

export const QuickTaskDialog = ({
  open,
  onOpenChange,
  assigneeId,
  assigneeName,
  entrepriseId,
  onSuccess,
}: QuickTaskDialogProps) => {
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titre.trim()) {
      toast.error("Le titre est requis");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("taches").insert({
        titre: titre.trim(),
        description: description.trim() || null,
        date: format(date, "yyyy-MM-dd"),
        assigned_to: assigneeId,
        entreprise_id: entrepriseId,
        statut: "a_faire",
      });

      if (error) throw error;

      // Create notification for assignee
      await supabase.from("notifications").insert({
        user_id: assigneeId,
        titre: "Nouvelle tâche assignée",
        message: `Une nouvelle tâche vous a été assignée: ${titre}`,
        type: "tache",
      });

      toast.success("Tâche envoyée avec succès");
      setTitre("");
      setDescription("");
      setDate(new Date());
      onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      toast.error("Erreur lors de la création de la tâche");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-background via-background to-primary/5 border-primary/20">
        <DialogHeader className="pb-4 border-b border-primary/20">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <ClipboardList className="w-5 h-5 text-primary" />
            Assigner une tâche
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Assignee display */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Destinataire</p>
              <p className="font-medium">{assigneeName}</p>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="titre">Titre de la tâche *</Label>
            <Input
              id="titre"
              placeholder="Ex: Préparer le dossier client"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              className="border-primary/20 focus:border-primary"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optionnel)</Label>
            <Textarea
              id="description"
              placeholder="Détails supplémentaires..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="border-primary/20 focus:border-primary resize-none"
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>Date d'échéance</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal border-primary/20",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: fr }) : "Sélectionner"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  initialFocus
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Submit */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary/90 shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <ClipboardList className="w-4 h-4 mr-2" />
              )}
              Envoyer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
