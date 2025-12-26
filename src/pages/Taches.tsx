import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckSquare, Plus, ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useEntreprise } from "@/hooks/useEntreprise";
import { TacheDialog } from "@/components/dialogs/TacheDialog";

interface Tache {
  id: string;
  titre: string;
  description: string | null;
  statut: string;
  date: string;
  is_ai_generated: boolean | null;
}

const Taches = () => {
  const { entrepriseId, isLoading: entrepriseLoading } = useEntreprise();
  const [taches, setTaches] = useState<Tache[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchTaches = useCallback(async () => {
    if (!entrepriseId) return;

    const { data } = await supabase
      .from("taches")
      .select("*")
      .eq("entreprise_id", entrepriseId)
      .order("date", { ascending: false });

    setTaches(data || []);
    setIsLoading(false);
  }, [entrepriseId]);

  useEffect(() => {
    if (entrepriseId) {
      fetchTaches();
    }
  }, [entrepriseId, fetchTaches]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-FR");
  };

  const toggleStatut = async (tache: Tache) => {
    const newStatut = tache.statut === "a_faire" ? "fait" : "a_faire";
    await supabase
      .from("taches")
      .update({ statut: newStatut })
      .eq("id", tache.id);

    setTaches(taches.map(t => t.id === tache.id ? { ...t, statut: newStatut } : t));
  };

  if (entrepriseLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8 premium-header rounded-xl p-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Tâches</h1>
            <p className="text-muted-foreground">Gérez vos tâches</p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-end mb-6"
        >
          <Button onClick={() => setDialogOpen(true)} className="premium-button">
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle tâche
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-border/50 overflow-hidden premium-card"
        >
          {taches.length > 0 ? (
            <div className="divide-y divide-border/50">
              {taches.map((tache) => (
                <div key={tache.id} className="p-4 flex items-center gap-4 hover:bg-secondary/30 transition-colors premium-list-item">
                  <button
                    onClick={() => toggleStatut(tache)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      tache.statut === "fait"
                        ? "bg-success border-success"
                        : "border-muted-foreground hover:border-primary"
                    }`}
                  >
                    {tache.statut === "fait" && <Check className="w-4 h-4 text-white" />}
                  </button>
                  <div className="flex-1">
                    <div className={`font-medium ${tache.statut === "fait" ? "line-through text-muted-foreground" : ""}`}>
                      {tache.titre}
                    </div>
                    {tache.description && (
                      <div className="text-sm text-muted-foreground">{tache.description}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {tache.is_ai_generated && (
                      <Badge variant="outline" className="text-xs">IA</Badge>
                    )}
                    <span className="text-sm text-muted-foreground">{formatDate(tache.date)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <CheckSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Aucune tâche pour le moment</p>
            </div>
          )}
        </motion.div>
      </div>

      {entrepriseId && (
        <TacheDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          entrepriseId={entrepriseId}
          onSuccess={fetchTaches}
        />
      )}
    </div>
  );
};

export default Taches;
