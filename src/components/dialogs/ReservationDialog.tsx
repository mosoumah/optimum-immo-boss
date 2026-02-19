import { useState, useEffect, useMemo } from "react";
import { format, differenceInDays, differenceInWeeks, differenceInMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useEntreprise } from "@/hooks/useEntreprise";
import { toast } from "sonner";

interface Client {
  id: string;
  nom: string;
}

interface ReservationData {
  id?: string;
  client_id: string;
  property_name: string;
  type_location: string;
  date_arrivee: string;
  date_depart: string;
  prix_unitaire: number;
  montant_total: number;
  montant_paye: number;
  caution: number;
  statut: string;
  generer_facture: boolean;
  notes: string;
}

interface ReservationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservation?: ReservationData | null;
  onSuccess: () => void;
}

const typeOptions = [
  { value: "jour", label: "Jour" },
  { value: "semaine", label: "Semaine" },
  { value: "mois", label: "Mois" },
];

const statutOptions = [
  { value: "en_attente", label: "En attente" },
  { value: "confirmee", label: "Confirmée" },
  { value: "en_cours", label: "En cours" },
  { value: "terminee", label: "Terminée" },
  { value: "annulee", label: "Annulée" },
];

export const ReservationDialog = ({ open, onOpenChange, reservation, onSuccess }: ReservationDialogProps) => {
  const { entrepriseId } = useEntreprise();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);

  const [clientId, setClientId] = useState("");
  const [propertyName, setPropertyName] = useState("");
  const [typeLocation, setTypeLocation] = useState("jour");
  const [dateArrivee, setDateArrivee] = useState<Date | undefined>();
  const [dateDepart, setDateDepart] = useState<Date | undefined>();
  const [prixUnitaire, setPrixUnitaire] = useState(0);
  const [montantPaye, setMontantPaye] = useState(0);
  const [caution, setCaution] = useState(0);
  const [statut, setStatut] = useState("confirmee");
  const [genererFacture, setGenererFacture] = useState(false);
  const [notes, setNotes] = useState("");

  const montantTotal = useMemo(() => {
    if (!dateArrivee || !dateDepart || prixUnitaire <= 0) return 0;
    let units = 0;
    if (typeLocation === "jour") {
      units = Math.max(differenceInDays(dateDepart, dateArrivee), 1);
    } else if (typeLocation === "semaine") {
      units = Math.max(Math.ceil(differenceInDays(dateDepart, dateArrivee) / 7), 1);
    } else {
      units = Math.max(differenceInMonths(dateDepart, dateArrivee), 1);
    }
    return units * prixUnitaire;
  }, [dateArrivee, dateDepart, prixUnitaire, typeLocation]);

  useEffect(() => {
    if (!open || !entrepriseId) return;
    supabase
      .from("clients")
      .select("id, nom")
      .eq("entreprise_id", entrepriseId)
      .order("nom")
      .then(({ data }) => setClients(data || []));
  }, [open, entrepriseId]);

  useEffect(() => {
    if (reservation) {
      setClientId(reservation.client_id);
      setPropertyName(reservation.property_name);
      setTypeLocation(reservation.type_location);
      setDateArrivee(new Date(reservation.date_arrivee));
      setDateDepart(new Date(reservation.date_depart));
      setPrixUnitaire(reservation.prix_unitaire);
      setMontantPaye(reservation.montant_paye);
      setCaution(reservation.caution);
      setStatut(reservation.statut);
      setGenererFacture(reservation.generer_facture);
      setNotes(reservation.notes || "");
    } else {
      setClientId("");
      setPropertyName("");
      setTypeLocation("jour");
      setDateArrivee(undefined);
      setDateDepart(undefined);
      setPrixUnitaire(0);
      setMontantPaye(0);
      setCaution(0);
      setStatut("confirmee");
      setGenererFacture(false);
      setNotes("");
    }
  }, [reservation, open]);

  const handleSubmit = async () => {
    if (!entrepriseId || !clientId || !propertyName || !dateArrivee || !dateDepart) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }
    setLoading(true);
    const payload = {
      entreprise_id: entrepriseId,
      client_id: clientId,
      property_name: propertyName,
      type_location: typeLocation,
      date_arrivee: format(dateArrivee, "yyyy-MM-dd"),
      date_depart: format(dateDepart, "yyyy-MM-dd"),
      prix_unitaire: prixUnitaire,
      montant_total: montantTotal,
      montant_paye: montantPaye,
      caution,
      statut,
      generer_facture: genererFacture,
      notes: notes || null,
    };

    let error;
    if (reservation?.id) {
      ({ error } = await supabase.from("reservations" as any).update(payload as any).eq("id", reservation.id));
    } else {
      ({ error } = await supabase.from("reservations" as any).insert(payload as any));
    }

    setLoading(false);
    if (error) {
      toast.error("Erreur lors de l'enregistrement");
      console.error(error);
    } else {
      toast.success(reservation?.id ? "Réservation modifiée" : "Réservation créée");
      onOpenChange(false);
      onSuccess();
    }
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("fr-GN", { style: "decimal", minimumFractionDigits: 0 }).format(v) + " GNF";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{reservation?.id ? "Modifier la réservation" : "Nouvelle réservation"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Client */}
          <div className="space-y-1.5">
            <Label>Client *</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger><SelectValue placeholder="Sélectionner un client" /></SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bien */}
          <div className="space-y-1.5">
            <Label>Nom du bien *</Label>
            <Input value={propertyName} onChange={(e) => setPropertyName(e.target.value)} placeholder="Ex: Appartement T3 Kaloum" />
          </div>

          {/* Type location */}
          <div className="space-y-1.5">
            <Label>Type de location *</Label>
            <Select value={typeLocation} onValueChange={setTypeLocation}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {typeOptions.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Date d'arrivée *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dateArrivee && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateArrivee ? format(dateArrivee, "dd/MM/yyyy") : "Choisir"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateArrivee} onSelect={setDateArrivee} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label>Date de départ *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dateDepart && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateDepart ? format(dateDepart, "dd/MM/yyyy") : "Choisir"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateDepart} onSelect={setDateDepart} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Prix */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Prix unitaire (GNF)</Label>
              <Input type="number" value={prixUnitaire || ""} onChange={(e) => setPrixUnitaire(Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label>Montant total</Label>
              <div className="h-10 flex items-center px-4 rounded-lg border border-input bg-muted text-sm font-medium">
                {formatCurrency(montantTotal)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Montant payé (GNF)</Label>
              <Input type="number" value={montantPaye || ""} onChange={(e) => setMontantPaye(Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label>Caution (GNF)</Label>
              <Input type="number" value={caution || ""} onChange={(e) => setCaution(Number(e.target.value))} />
            </div>
          </div>

          {/* Statut */}
          <div className="space-y-1.5">
            <Label>Statut</Label>
            <Select value={statut} onValueChange={setStatut}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {statutOptions.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Generer facture */}
          <div className="flex items-center gap-2">
            <Checkbox id="generer-facture" checked={genererFacture} onCheckedChange={(v) => setGenererFacture(v === true)} />
            <Label htmlFor="generer-facture" className="cursor-pointer">Générer facture automatiquement</Label>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes supplémentaires..." rows={3} />
          </div>

          <Button onClick={handleSubmit} disabled={loading} className="w-full">
            {loading ? "Enregistrement..." : reservation?.id ? "Modifier" : "Créer la réservation"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
