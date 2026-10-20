import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { handleSubscriptionExpiredMessage } from "@/lib/planLimitToast";

/** Réservation concernée par un encaissement (champs strictement nécessaires). */
export interface PaiementReservation {
  id: string;
  montant_total: number;
  montant_paye: number;
}

interface PaiementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservation: PaiementReservation | null;
  /** Contexte affiché sous le titre (ex. « Villa Kipé · 14:30 »). */
  contexte?: string;
  onSuccess: () => void;
}

const formatGNF = (amount: number) =>
  new Intl.NumberFormat("fr-GN", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount) +
  " GNF";

/**
 * Encaissement d'un paiement sur une réservation.
 *
 * Un seul update est envoyé (`reservations.montant_paye`). Le serveur crée le
 * revenu correspondant et passe la facture liée à « payé » quand la réservation
 * est entièrement soldée : le client n'écrit jamais dans `revenus`.
 */
export const PaiementDialog = ({
  open,
  onOpenChange,
  reservation,
  contexte,
  onSuccess,
}: PaiementDialogProps) => {
  const navigate = useNavigate();
  const [montant, setMontant] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const total = Number(reservation?.montant_total ?? 0);
  const dejaPaye = Number(reservation?.montant_paye ?? 0);
  const reste = Math.max(total - dejaPaye, 0);

  // Champ pré-rempli avec le reste à payer à chaque ouverture.
  useEffect(() => {
    if (!open) return;
    setMontant(reste > 0 ? String(Math.round(reste)) : "");
  }, [open, reste]);

  const montantValue = Number.parseFloat(montant) || 0;
  const montantInvalide = montantValue <= 0 || montantValue > reste;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reservation) return;

    if (montantValue <= 0) {
      toast.error("Le montant doit être supérieur à 0");
      return;
    }
    if (montantValue > reste) {
      toast.error("Le montant dépasse le reste à payer");
      return;
    }

    setIsSubmitting(true);
    // Update unique : le serveur gère le revenu et la facture.
    const { error } = await supabase
      .from("reservations")
      .update({ montant_paye: dejaPaye + montantValue })
      .eq("id", reservation.id);
    setIsSubmitting(false);

    if (error) {
      // Abonnement expiré : le serveur refuse toute écriture (lecture seule).
      if (handleSubscriptionExpiredMessage(error.message, { toastSonner: toast, navigate })) return;
      toast.error("Erreur lors de l'enregistrement du paiement");
      return;
    }

    toast.success("Paiement enregistré");
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Encaisser un paiement</DialogTitle>
          <DialogDescription>
            {contexte ? `${contexte} — ` : ""}Reste à payer : {formatGNF(reste)}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="paiement-montant">Montant reçu (GNF) *</Label>
            <Input
              id="paiement-montant"
              type="number"
              min="0"
              max={reste}
              step="1"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              placeholder="0"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Déjà payé : {formatGNF(dejaPaye)} · Total : {formatGNF(total)}
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting || montantInvalide}>
              {isSubmitting ? "Enregistrement..." : "Enregistrer le paiement"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
