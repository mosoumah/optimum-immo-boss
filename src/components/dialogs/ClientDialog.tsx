import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";

interface Agent {
  id: string;
  nom: string;
  email: string;
}

interface ClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entrepriseId: string;
  onSuccess: () => void;
}

export const ClientDialog = ({ open, onOpenChange, entrepriseId, onSuccess }: ClientDialogProps) => {
  const { isAdmin } = useUserRole();
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [assignedTo, setAssignedTo] = useState<string>("");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchAgents = async () => {
      if (!isAdmin || !entrepriseId) return;
      
      // Fetch users with agent role from the same entreprise
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, nom, email")
        .eq("entreprise_id", entrepriseId);
      
      if (profiles) {
        // Filter to get only agents
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
    };

    if (open) {
      fetchAgents();
    }
  }, [open, isAdmin, entrepriseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) {
      toast.error("Le nom est requis");
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.from("clients").insert({
      nom: nom.trim(),
      telephone: telephone.trim() || null,
      email: email.trim() || null,
      entreprise_id: entrepriseId,
      assigned_to: assignedTo || null,
    });

    setIsLoading(false);

    if (error) {
      toast.error("Erreur lors de la création du client");
      return;
    }

    toast.success("Client créé avec succès");
    setNom("");
    setTelephone("");
    setEmail("");
    setAssignedTo("");
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouveau client</DialogTitle>
          <DialogDescription>Ajoutez un nouveau client à votre liste.</DialogDescription>
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
          {isAdmin && agents.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="assigned_to">Assigner à un agent</Label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un agent (optionnel)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucun</SelectItem>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.nom} ({agent.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
