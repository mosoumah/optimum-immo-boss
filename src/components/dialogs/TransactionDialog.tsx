import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useEntreprise } from "@/hooks/useEntreprise";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: any | null;
  onSuccess: () => void;
}

export const TransactionDialog = ({ open, onOpenChange, transaction, onSuccess }: TransactionDialogProps) => {
  const { toast } = useToast();
  const { entrepriseId } = useEntreprise();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clients, setClients] = useState<{ id: string; nom: string }[]>([]);
  const [properties, setProperties] = useState<{ id: string; nom: string }[]>([]);

  const [form, setForm] = useState({
    client_id: "",
    property_id: "",
    montant_vente: "",
    commission: "",
    date_vente: new Date().toISOString().split("T")[0],
    statut: "en_cours",
    notes: "",
  });

  useEffect(() => {
    if (!entrepriseId || !open) return;
    Promise.all([
      supabase.from("clients").select("id, nom").eq("entreprise_id", entrepriseId).order("nom"),
      supabase.from("properties").select("id, nom").eq("entreprise_id", entrepriseId).order("nom"),
    ]).then(([c, p]) => {
      setClients(c.data || []);
      setProperties(p.data || []);
    });
  }, [entrepriseId, open]);

  useEffect(() => {
    if (transaction) {
      setForm({
        client_id: transaction.client_id || "",
        property_id: transaction.property_id || "",
        montant_vente: transaction.montant_vente?.toString() || "",
        commission: transaction.commission?.toString() || "",
        date_vente: transaction.date_vente || new Date().toISOString().split("T")[0],
        statut: transaction.statut || "en_cours",
        notes: transaction.notes || "",
      });
    } else {
      setForm({ client_id: "", property_id: "", montant_vente: "", commission: "", date_vente: new Date().toISOString().split("T")[0], statut: "en_cours", notes: "" });
    }
  }, [transaction, open]);

  const handleSubmit = async () => {
    if (!form.client_id || !form.property_id || !entrepriseId) return;
    setIsSubmitting(true);

    const payload = {
      entreprise_id: entrepriseId,
      client_id: form.client_id,
      property_id: form.property_id,
      created_by: user?.id || null,
      montant_vente: parseFloat(form.montant_vente) || 0,
      commission: parseFloat(form.commission) || 0,
      date_vente: form.date_vente,
      statut: form.statut,
      notes: form.notes || null,
    };

    const { error } = transaction
      ? await supabase.from("sales_transactions").update(payload).eq("id", transaction.id)
      : await supabase.from("sales_transactions").insert(payload);

    setIsSubmitting(false);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Succès", description: transaction ? "Transaction modifiée" : "Transaction créée" });
      onOpenChange(false);
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{transaction ? "Modifier la transaction" : "Nouvelle transaction"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Client *</Label>
            <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
              <SelectTrigger><SelectValue placeholder="Sélectionner un client" /></SelectTrigger>
              <SelectContent>
                {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Bien *</Label>
            <Select value={form.property_id} onValueChange={(v) => setForm({ ...form, property_id: v })}>
              <SelectTrigger><SelectValue placeholder="Sélectionner un bien" /></SelectTrigger>
              <SelectContent>
                {properties.map((p) => <SelectItem key={p.id} value={p.id}>{p.nom}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Montant de vente (GNF)</Label><Input type="number" value={form.montant_vente} onChange={(e) => setForm({ ...form, montant_vente: e.target.value })} /></div>
            <div><Label>Commission (GNF)</Label><Input type="number" value={form.commission} onChange={(e) => setForm({ ...form, commission: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Date de vente</Label><Input type="date" value={form.date_vente} onChange={(e) => setForm({ ...form, date_vente: e.target.value })} /></div>
            <div>
              <Label>Statut</Label>
              <Select value={form.statut} onValueChange={(v) => setForm({ ...form, statut: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en_cours">En cours</SelectItem>
                  <SelectItem value="sous_compromis">Sous compromis</SelectItem>
                  <SelectItem value="finalisee">Finalisée</SelectItem>
                  <SelectItem value="annulee">Annulée</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
          <Button onClick={handleSubmit} disabled={isSubmitting || !form.client_id || !form.property_id} className="w-full">
            {isSubmitting ? "Enregistrement..." : transaction ? "Modifier" : "Créer la transaction"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
