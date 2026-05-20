import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Sparkles, Loader2, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Client {
  id: string;
  nom: string;
  telephone: string | null;
  email: string | null;
}

interface Property {
  id: string;
  nom: string;
  adresse: string | null;
  type_bien: string;
  prix: number;
}

interface Entreprise {
  id: string;
  nom: string;
  telephone: string | null;
  email: string | null;
  adresse: string | null;
  signature: string | null;
}

interface DocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entrepriseId: string;
  onSuccess: () => void;
}

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

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-2 pt-2">
    <h3 className="text-sm font-semibold text-primary">{children}</h3>
    <Separator className="flex-1" />
  </div>
);

const DatePickerField = ({ label, date, onSelect }: { label: string; date: Date; onSelect: (d: Date | undefined) => void }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={setOpen} modal={true}>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {format(date, "dd/MM/yyyy")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => { onSelect(d); setOpen(false); }}
            initialFocus
            className="p-3 pointer-events-auto"
            locale={fr}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export const DocumentDialog = ({ open, onOpenChange, entrepriseId, onSuccess }: DocumentDialogProps) => {
  const { user } = useAuth();

  // Section 1 — Document
  const [type, setType] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [creationDate, setCreationDate] = useState<Date>(new Date());
  const typeTriggerRef = useRef<HTMLButtonElement | null>(null);

  // Section 2 — Agency
  const [agencyName, setAgencyName] = useState("");
  const [agentName, setAgentName] = useState("");
  const [agencyPhone, setAgencyPhone] = useState("");
  const [agencyEmail, setAgencyEmail] = useState("");

  // Section 3 — Client
  const [clientId, setClientId] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientAddress, setClientAddress] = useState("");

  // Section 4 — Property
  const [propertyId, setPropertyId] = useState("");
  const [propertyTitle, setPropertyTitle] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");
  const [propertyType, setPropertyType] = useState("");

  // Section 5 — Transaction
  const [salePrice, setSalePrice] = useState("");
  const [rentalDuration, setRentalDuration] = useState("");
  const [securityDeposit, setSecurityDeposit] = useState("");

  // Section 6 — Clauses
  const [clauses, setClauses] = useState("");

  // Section 7 — Signatures
  const [signatureDate, setSignatureDate] = useState<Date>(new Date());

  // Content
  const [contenu, setContenu] = useState("");

  // Data
  const [clients, setClients] = useState<Client[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [entreprise, setEntreprise] = useState<Entreprise | null>(null);

  // UI
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [clientsRes, entrepriseRes, propertiesRes, profileRes] = await Promise.all([
        supabase.from("clients").select("id, nom, telephone, email").eq("entreprise_id", entrepriseId).order("nom"),
        supabase.from("entreprises").select("id, nom, telephone, email, adresse, signature").eq("id", entrepriseId).maybeSingle(),
        supabase.from("properties").select("id, nom, adresse, type_bien, prix").eq("entreprise_id", entrepriseId).order("nom"),
        user ? supabase.from("profiles").select("nom, email").eq("id", user.id).maybeSingle() : null,
      ]);

      setClients(clientsRes.data || []);
      setProperties(propertiesRes.data || []);

      const ent = entrepriseRes.data;
      setEntreprise(ent);
      if (ent) {
        setAgencyName(ent.nom || "");
        setAgencyPhone(ent.telephone || "");
        setAgencyEmail(ent.email || "");
      }

      if (profileRes?.data) {
        setAgentName(profileRes.data.nom || "");
      }
    };

    if (open && entrepriseId) {
      fetchData();
    }
  }, [open, entrepriseId, user]);

  // Auto-fill client fields
  useEffect(() => {
    const selected = clients.find(c => c.id === clientId);
    if (selected) {
      setClientPhone(selected.telephone || "");
      setClientEmail(selected.email || "");
    } else {
      setClientPhone("");
      setClientEmail("");
    }
  }, [clientId, clients]);

  // Auto-fill property fields
  useEffect(() => {
    const selected = properties.find(p => p.id === propertyId);
    if (selected) {
      setPropertyTitle(selected.nom || "");
      setPropertyAddress(selected.adresse || "");
      setPropertyType(selected.type_bien || "");
      if (!salePrice) setSalePrice(selected.prix?.toString() || "");
    } else {
      setPropertyTitle("");
      setPropertyAddress("");
      setPropertyType("");
    }
  }, [propertyId, properties, salePrice]);

  const selectedClient = clients.find(c => c.id === clientId);

  const handleGenerate = async () => {
    if (!type) {
      toast.error("Le type de document est obligatoire pour générer avec l'IA");
      typeTriggerRef.current?.focus();
      typeTriggerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-document", {
        body: {
          entrepriseNom: agencyName,
          typeDocument: type,
          documentNumber,
          creationDate: format(creationDate, "dd/MM/yyyy"),
          agentName,
          agencyPhone,
          agencyEmail,
          clientNom: selectedClient?.nom || "",
          clientPhone,
          clientEmail,
          clientAddress,
          propertyTitle,
          propertyAddress,
          propertyType,
          salePrice,
          rentalDuration,
          securityDeposit,
          clauses,
          signatureDate: format(signatureDate, "dd/MM/yyyy"),
        },
      });

      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }

      const generatedContent = data?.content || data?.generated_content || data?.text || "";
      if (!generatedContent.trim()) {
        toast.error("L'IA n'a pas retourné de contenu. Réessayez.");
        return;
      }

      setContenu(generatedContent);
      toast.success("Document généré avec succès !");
    } catch (error) {
      console.error("Erreur génération:", error);
      toast.error("Erreur lors de la génération du document");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!type) { toast.error("Le type de document est requis"); return; }

    setIsLoading(true);
    const { error } = await supabase.from("documents").insert({
      type,
      contenu: contenu.trim() || null,
      client_id: clientId || null,
      entreprise_id: entrepriseId,
    });
    setIsLoading(false);

    if (error) { toast.error("Erreur lors de la création du document"); return; }

    toast.success("Document créé avec succès");
    resetForm();
    onOpenChange(false);
    onSuccess();
  };

  const resetForm = () => {
    setType(""); setDocumentNumber(""); setCreationDate(new Date());
    setClientId(""); setClientPhone(""); setClientEmail(""); setClientAddress("");
    setPropertyId(""); setPropertyTitle(""); setPropertyAddress(""); setPropertyType("");
    setSalePrice(""); setRentalDuration(""); setSecurityDeposit("");
    setClauses(""); setSignatureDate(new Date()); setContenu("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Nouveau document IA
          </DialogTitle>
          <DialogDescription>Remplissez les informations pour générer un document professionnel.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* SECTION 1 — Document */}
          <SectionTitle>1. Informations du document</SectionTitle>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Type de document *</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger ref={typeTriggerRef}><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  {documentTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Numéro de document</Label>
              <Input value={documentNumber} onChange={e => setDocumentNumber(e.target.value)} placeholder="DOC-2026-001" />
            </div>
            <DatePickerField label="Date de création" date={creationDate} onSelect={d => d && setCreationDate(d)} />
          </div>

          {/* SECTION 2 — Agency */}
          <SectionTitle>2. Informations de l'agence</SectionTitle>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nom de l'agence</Label>
              <Input value={agencyName} onChange={e => setAgencyName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Nom de l'agent</Label>
              <Input value={agentName} onChange={e => setAgentName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input value={agencyPhone} onChange={e => setAgencyPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={agencyEmail} onChange={e => setAgencyEmail(e.target.value)} />
            </div>
          </div>

          {/* SECTION 3 — Client */}
          <SectionTitle>3. Informations du client</SectionTitle>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Client</Label>
              <Select value={clientId} onValueChange={val => setClientId(val === "none" ? "" : val)}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un client" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun client</SelectItem>
                  {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="Téléphone du client" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="Email du client" />
            </div>
            <div className="space-y-2">
              <Label>Adresse</Label>
              <Input value={clientAddress} onChange={e => setClientAddress(e.target.value)} placeholder="Adresse du client" />
            </div>
          </div>

          {/* SECTION 4 — Property */}
          <SectionTitle>4. Informations du bien</SectionTitle>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Bien</Label>
              <Select value={propertyId} onValueChange={val => setPropertyId(val === "none" ? "" : val)}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un bien" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun bien</SelectItem>
                  {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.nom}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Adresse du bien</Label>
              <Input value={propertyAddress} onChange={e => setPropertyAddress(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Type de bien</Label>
              <Input value={propertyType} onChange={e => setPropertyType(e.target.value)} />
            </div>
          </div>

          {/* SECTION 5 — Transaction */}
          <SectionTitle>5. Informations de la transaction</SectionTitle>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Prix / Loyer</Label>
              <Input value={salePrice} onChange={e => setSalePrice(e.target.value)} placeholder="Ex: 5 000 000 GNF" />
            </div>
            <div className="space-y-2">
              <Label>Durée de location</Label>
              <Input value={rentalDuration} onChange={e => setRentalDuration(e.target.value)} placeholder="Ex: 12 mois" />
            </div>
            <div className="space-y-2">
              <Label>Caution</Label>
              <Input value={securityDeposit} onChange={e => setSecurityDeposit(e.target.value)} placeholder="Ex: 2 000 000 GNF" />
            </div>
          </div>

          {/* SECTION 6 — Clauses */}
          <SectionTitle>6. Clauses personnalisées</SectionTitle>
          <div className="space-y-2">
            <Textarea
              value={clauses}
              onChange={e => setClauses(e.target.value)}
              placeholder="Ajoutez des clauses spécifiques à inclure dans le document..."
              rows={4}
            />
          </div>

          {/* SECTION 7 — Signatures */}
          <SectionTitle>7. Signatures</SectionTitle>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Signature client</Label>
              <Input disabled value={selectedClient?.nom || "—"} className="bg-muted" />
              <p className="text-xs text-muted-foreground">La signature physique se fait sur le document imprimé.</p>
            </div>
            <div className="space-y-2">
              <Label>Signature agence</Label>
              {entreprise?.signature ? (
                <img src={entreprise.signature} alt="Signature agence" className="h-16 border rounded-md p-1 bg-background" />
              ) : (
                <p className="text-xs text-muted-foreground">Aucune signature configurée. Rendez-vous dans Paramètres.</p>
              )}
            </div>
            <DatePickerField label="Date de signature" date={signatureDate} onSelect={d => d && setSignatureDate(d)} />
          </div>

          {/* Generate button */}
          <Separator />
          <Button type="button" variant="outline" onClick={handleGenerate} disabled={isGenerating} className="w-full border-primary/50 hover:bg-primary/10">
            {isGenerating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Génération en cours...</> : <><Sparkles className="w-4 h-4 mr-2" />Générer avec l'IA</>}
          </Button>

          {/* Content */}
          <div className="space-y-2">
            <Label>Contenu du document</Label>
            <Textarea value={contenu} onChange={e => setContenu(e.target.value)} placeholder="Le contenu sera généré par l'IA ou saisissez-le manuellement" rows={12} className="font-mono text-sm" />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit" disabled={isLoading}>{isLoading ? "Enregistrement..." : "Enregistrer"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
