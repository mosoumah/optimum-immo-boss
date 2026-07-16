import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useEntreprise } from "@/hooks/useEntreprise";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays } from "date-fns";

import type { Database } from "@/integrations/supabase/types";

type ReservationRow = Database["public"]["Tables"]["reservations"]["Row"];

interface ReservationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservation?: ReservationRow | null;
  onSuccess: () => void;
}

export const ReservationDialog = ({ open, onOpenChange, reservation, onSuccess }: ReservationDialogProps) => {
  const { toast } = useToast();
  const { entrepriseId } = useEntreprise();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clients, setClients] = useState<{ id: string; nom: string }[]>([]);
  const [properties, setProperties] = useState<{ id: string; nom: string; statut: string; prix: number }[]>([]);

  const [form, setForm] = useState({
    client_id: "",
    property_id: "",
    property_name: "",
    type_location: "jour",
    date_arrivee: "",
    date_depart: "",
    nombre_heures: "",
    prix_unitaire: "",
    montant_paye: "",
    caution: "",
    statut: "en_attente",
    generer_facture: false,
    notes: "",
  });

  useEffect(() => {
    if (!entrepriseId || !open) return;
    Promise.all([
      supabase.from("clients").select("id, nom").eq("entreprise_id", entrepriseId).order("nom"),
      supabase.from("properties").select("id, nom, statut, prix").eq("entreprise_id", entrepriseId).order("nom"),
    ]).then(([c, p]) => {
      setClients(c.data || []);
      setProperties(p.data || []);
    });
  }, [entrepriseId, open]);

  useEffect(() => {
    if (reservation) {
      const isHeure = reservation.type_location === "heure";
      const nbHeures = isHeure && reservation.prix_unitaire > 0
        ? Math.round((Number(reservation.montant_total) / Number(reservation.prix_unitaire)) * 100) / 100
        : 0;
      setForm({
        client_id: reservation.client_id || "",
        property_id: reservation.property_id || "",
        property_name: reservation.property_name || "",
        type_location: reservation.type_location || "jour",
        date_arrivee: reservation.date_arrivee || "",
        date_depart: reservation.date_depart || "",
        nombre_heures: nbHeures ? nbHeures.toString() : "",
        prix_unitaire: reservation.prix_unitaire?.toString() || "",
        montant_paye: reservation.montant_paye?.toString() || "",
        caution: reservation.caution?.toString() || "",
        statut: reservation.statut || "en_attente",
        generer_facture: reservation.generer_facture || false,
        notes: reservation.notes || "",
      });
    } else {
      setForm({ client_id: "", property_id: "", property_name: "", type_location: "jour", date_arrivee: "", date_depart: "", nombre_heures: "", prix_unitaire: "", montant_paye: "", caution: "", statut: "en_attente", generer_facture: false, notes: "" });
    }
  }, [reservation, open]);

  const isHeure = form.type_location === "heure";

  const { montantTotal, unites, resteAPayer } = useMemo(() => {
    const prix = parseFloat(form.prix_unitaire) || 0;
    if (isHeure) {
      const h = parseFloat(form.nombre_heures) || 0;
      const total = h * prix;
      const paye = parseFloat(form.montant_paye) || 0;
      return { montantTotal: total, unites: h, resteAPayer: Math.max(total - paye, 0) };
    }
    if (!form.date_arrivee || !form.date_depart || !form.prix_unitaire) return { montantTotal: 0, unites: 0, resteAPayer: 0 };
    const start = new Date(form.date_arrivee);
    const end = new Date(form.date_depart);
    const units = Math.max(Math.abs(differenceInDays(end, start)), 1);
    const total = units * prix;
    const paye = parseFloat(form.montant_paye) || 0;
    return { montantTotal: total, unites: units, resteAPayer: Math.max(total - paye, 0) };
  }, [form.date_arrivee, form.date_depart, form.prix_unitaire, form.montant_paye, form.nombre_heures, isHeure]);

  const datesInversees = !isHeure && form.date_arrivee && form.date_depart && new Date(form.date_depart) < new Date(form.date_arrivee);
  const typeLabel = isHeure ? "heure" : "jour";
  const canCalculate = isHeure
    ? !!(form.nombre_heures && form.prix_unitaire)
    : !!(form.date_arrivee && form.date_depart && form.prix_unitaire);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("fr-GN", { style: "decimal", minimumFractionDigits: 0 }).format(amount) + " GNF";

  const handleSubmit = async () => {
    if (!form.client_id || !entrepriseId) return;
    if (parseFloat(form.prix_unitaire) <= 0) {
      toast({ title: "Erreur", description: "Le prix unitaire doit être supérieur à 0", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    const selectedProperty = properties.find((p) => p.id === form.property_id);
    const payload = {
      entreprise_id: entrepriseId,
      client_id: form.client_id,
      property_id: form.property_id || null,
      property_name: selectedProperty?.nom || form.property_name || "—",
      type_location: form.type_location,
      date_arrivee: form.date_arrivee,
      date_depart: isHeure ? (form.date_depart || form.date_arrivee) : form.date_depart,
      prix_unitaire: parseFloat(form.prix_unitaire) || 0,
      montant_total: montantTotal,
      montant_paye: parseFloat(form.montant_paye) || 0,
      caution: parseFloat(form.caution) || 0,
      statut: form.statut,
      generer_facture: form.generer_facture,
      notes: form.notes || null,
    };

    let result;
    let newReservationId: string | null = null;
    if (reservation) {
      result = await supabase.from("reservations").update(payload).eq("id", reservation.id);
    } else {
      result = await supabase.from("reservations").insert(payload).select("id").single();
      if (result.data) {
        newReservationId = result.data.id;
      }
    }

    if (result.error) {
      setIsSubmitting(false);
      toast({ title: "Erreur", description: result.error.message, variant: "destructive" });
      return;
    }

    // Générer la facture automatiquement si coché (nouvelle réservation uniquement)
    if (form.generer_facture && !reservation && !result.error) {
      const propertyName = selectedProperty?.nom || form.property_name || "—";
      const paye = parseFloat(form.montant_paye) || 0;
      const resteDesc = paye > 0 && paye < montantTotal
        ? ` | Payé: ${formatCurrency(paye)} — Reste: ${formatCurrency(montantTotal - paye)}`
        : "";
      const periode = isHeure
        ? `le ${form.date_arrivee} — ${unites} heure${unites > 1 ? "s" : ""} × ${formatCurrency(parseFloat(form.prix_unitaire))}`
        : `du ${form.date_arrivee} au ${form.date_depart}`;
      const { error: factureError } = await supabase.from("factures").insert({
        client_id: form.client_id,
        entreprise_id: entrepriseId,
        montant: montantTotal,
        description: `Location ${propertyName} ${periode}${resteDesc}`,
        date: new Date().toISOString().split("T")[0],
        reservation_id: newReservationId,
      });
      if (factureError) {
        toast({ title: "Attention", description: "Réservation créée mais erreur lors de la génération de la facture : " + factureError.message, variant: "destructive" });
      } else {
        toast({ title: "Succès", description: "Réservation créée et facture générée" });
      }
    } else {
      toast({ title: "Succès", description: reservation ? "Réservation modifiée" : "Réservation créée" });
    }

    setIsSubmitting(false);
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{reservation ? "Modifier la réservation" : "Nouvelle réservation"}</DialogTitle>
          <DialogDescription>Remplissez les informations de la réservation ci-dessous.</DialogDescription>
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
            <Label>Bien</Label>
            <Select value={form.property_id} onValueChange={(v) => {
              const selected = properties.find(p => p.id === v);
              // Only auto-fill price for daily rentals; hourly price must be entered manually
              const nextPrix = form.type_location === "jour" && selected?.prix
                ? selected.prix.toString()
                : form.prix_unitaire;
              setForm({ ...form, property_id: v, prix_unitaire: nextPrix });
            }}>
              <SelectTrigger><SelectValue placeholder="Sélectionner un bien" /></SelectTrigger>
              <SelectContent>
                {properties
                  .filter((p) => p.statut !== "reserve" || (reservation && reservation.property_id === p.id))
                  .map((p) => <SelectItem key={p.id} value={p.id}>{p.nom}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Type de location *</Label>
            <Select
              value={form.type_location}
              onValueChange={(v) => {
                if (v === "heure") {
                  // Reset price so user enters hourly rate manually
                  setForm({ ...form, type_location: v, prix_unitaire: "" });
                } else {
                  // Switching back to daily: auto-fill from selected property if available
                  const selected = properties.find(p => p.id === form.property_id);
                  setForm({
                    ...form,
                    type_location: v,
                    nombre_heures: "",
                    prix_unitaire: selected?.prix ? selected.prix.toString() : form.prix_unitaire,
                  });
                }
              }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="jour">Par jour</SelectItem>
                <SelectItem value="heure">Par heure</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {isHeure ? (
            <div>
              <Label>Nombre d'heures *</Label>
              <Select
                value={form.nombre_heures}
                onValueChange={(v) => {
                  const today = new Date();
                  const y = today.getFullYear();
                  const m = String(today.getMonth() + 1).padStart(2, "0");
                  const d = String(today.getDate()).padStart(2, "0");
                  const todayStr = form.date_arrivee || `${y}-${m}-${d}`;
                  setForm({ ...form, nombre_heures: v, date_arrivee: todayStr, date_depart: todayStr });
                }}
              >
                <SelectTrigger><SelectValue placeholder="Sélectionner la durée" /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 24].map((h) => (
                    <SelectItem key={h} value={h.toString()}>{h} heure{h > 1 ? "s" : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Date d'arrivée *</Label><Input type="date" value={form.date_arrivee} onChange={(e) => setForm({ ...form, date_arrivee: e.target.value })} /></div>
                <div><Label>Date de départ *</Label><Input type="date" value={form.date_depart} onChange={(e) => setForm({ ...form, date_depart: e.target.value })} /></div>
              </div>
              {datesInversees && (
                <p className="text-sm text-orange-500 -mt-2">⚠ La date de départ est avant la date d'arrivée</p>
              )}
            </>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Prix {isHeure ? "par heure" : "unitaire"} (GNF) *</Label><Input type="number" min="0" value={form.prix_unitaire} onChange={(e) => setForm({ ...form, prix_unitaire: e.target.value })} placeholder={isHeure ? "Saisir manuellement" : ""} /></div>
            <div>
              <Label>Montant total (auto)</Label>
              <div className={`h-10 px-3 flex items-center rounded-md text-sm font-medium ${canCalculate && montantTotal > 0 ? "bg-primary/10 text-primary font-bold" : "bg-muted text-muted-foreground"}`}>
                {canCalculate ? formatCurrency(montantTotal) : (isHeure ? "Remplir heures et prix" : "Remplir dates et prix")}
              </div>
              {canCalculate && montantTotal > 0 && (
                <p className="text-xs text-muted-foreground mt-1">{unites} {typeLabel}{unites > 1 ? "s" : ""} × {formatCurrency(parseFloat(form.prix_unitaire))}</p>
              )}
              {canCalculate && resteAPayer > 0 && resteAPayer < montantTotal && (
                <p className="text-xs text-primary font-semibold mt-1">Reste à payer : {formatCurrency(resteAPayer)}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Montant payé (GNF)</Label><Input type="number" value={form.montant_paye} onChange={(e) => setForm({ ...form, montant_paye: e.target.value })} /></div>
            <div><Label>Caution (GNF)</Label><Input type="number" value={form.caution} onChange={(e) => setForm({ ...form, caution: e.target.value })} /></div>
          </div>
          <div>
            <Label>Statut</Label>
            <Select value={form.statut} onValueChange={(v) => setForm({ ...form, statut: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en_attente">En attente</SelectItem>
                <SelectItem value="en_cours">En cours</SelectItem>
                <SelectItem value="terminee">Terminée</SelectItem>
                <SelectItem value="annulee">Annulée</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
          <div className="flex items-center gap-2">
            <Checkbox checked={form.generer_facture} onCheckedChange={(v) => setForm({ ...form, generer_facture: !!v })} />
            <Label className="text-sm cursor-pointer">Générer facture automatiquement</Label>
          </div>
          <Button onClick={handleSubmit} disabled={isSubmitting || !form.client_id || !form.date_arrivee || (!isHeure && !form.date_depart) || (isHeure && !form.nombre_heures) || !form.prix_unitaire} className="w-full">
            {isSubmitting ? "Enregistrement..." : reservation ? "Modifier" : "Créer la réservation"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
