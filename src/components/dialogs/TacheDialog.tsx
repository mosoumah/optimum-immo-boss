import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";

interface Agent {
  id: string;
  nom: string;
  email: string;
}

interface Client {
  id: string;
  nom: string;
}

interface TacheDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entrepriseId: string;
  onSuccess: () => void;
}

export const TacheDialog = ({ open, onOpenChange, entrepriseId, onSuccess }: TacheDialogProps) => {
  const { isAdmin } = useUserRole();
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [assignedTo, setAssignedTo] = useState<string>("");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!isAdmin || !entrepriseId) return;
      
      // Fetch users with agent role from the same entreprise
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, nom, email")
        .eq("entreprise_id", entrepriseId);
      
      if (profiles) {
        const agentList: Agent[] = [];
        for (const profile of profiles) {
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", profile.id)
            .maybeSingle();
          
          if (roleData?.role === "agent") {
            agentList.push(profile);
          }
        }
        setAgents(agentList);
      }

      // Fetch clients
      const { data: clientsData } = await supabase
        .from("clients")
        .select("id, nom")
        .eq("entreprise_id", entrepriseId)
        .order("nom");
      
      setClients(clientsData || []);
    };

    if (open) {
      fetchData();
    }
  }, [open, isAdmin, entrepriseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titre.trim()) {
      toast.error("Le titre est requis");
      return;
    }

    if (isAdmin && !assignedTo) {
      toast.error("Veuillez sélectionner un utilisateur à assigner");
      return;
    }

    setIsLoading(true);
    
    const { error } = await supabase.from("taches").insert({
      titre: titre.trim(),
      description: description.trim() || null,
      date: format(date, "yyyy-MM-dd"),
      entreprise_id: entrepriseId,
      statut: "a_faire" as const,
      assigned_to: assignedTo || null,
    });

    setIsLoading(false);

    if (error) {
      console.error("Error creating task:", error);
      toast.error("Erreur lors de la création de la tâche");
      return;
    }

    toast.success("Tâche créée avec succès");
    setTitre("");
    setDescription("");
    setDate(new Date());
    setAssignedTo("");
    setSelectedClientId("");
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nouvelle tâche</DialogTitle>
          <DialogDescription>Créez une nouvelle tâche à effectuer.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titre">Titre *</Label>
            <Input
              id="titre"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Titre de la tâche"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description de la tâche"
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

          {isAdmin && (
            <>
              <div className="space-y-2">
                <Label htmlFor="assigned_to">Assigner à *</Label>
                <Select value={assignedTo} onValueChange={setAssignedTo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un utilisateur" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.nom} ({agent.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {clients.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="client">Client lié (optionnel)</Label>
                  <Select value={selectedClientId || "none"} onValueChange={(val) => setSelectedClientId(val === "none" ? "" : val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}

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
