import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Client {
  id: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  created_at: string;
}

const Clients = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchClients = async () => {
      if (!user) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("entreprise_id")
        .eq("id", user.id)
        .maybeSingle();

      if (profileData?.entreprise_id) {
        const { data } = await supabase
          .from("clients")
          .select("*")
          .eq("entreprise_id", profileData.entreprise_id)
          .order("created_at", { ascending: false });

        setClients(data || []);
      }
      setIsLoading(false);
    };

    fetchClients();
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Clients</h1>
            <p className="text-muted-foreground">Gérez vos clients</p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-end mb-6"
        >
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau client
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-border/50 overflow-hidden"
        >
          {clients.length > 0 ? (
            <div className="divide-y divide-border/50">
              {clients.map((client) => (
                <div key={client.id} className="p-4 flex items-center gap-4 hover:bg-secondary/30 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{client.nom}</div>
                    <div className="text-sm text-muted-foreground">{client.email || "Pas d'email"}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">{client.telephone || "-"}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Aucun client pour le moment</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Clients;
