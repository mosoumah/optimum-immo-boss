import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckSquare, Plus, ArrowLeft, Check, Sparkles, Loader2 } from "lucide-react";
import { FloatingParticles } from "@/components/FloatingParticles";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useEntreprise } from "@/hooks/useEntreprise";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import { TacheDialog } from "@/components/dialogs/TacheDialog";
import { DynamicSidebar } from "@/components/DynamicSidebar";
import { toast } from "sonner";

interface Tache {
  id: string;
  titre: string;
  description: string | null;
  statut: string;
  date: string;
  is_ai_generated: boolean | null;
}

interface Suggestion {
  titre: string;
  description: string;
  priorite: string;
}

const Taches = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { entrepriseId, isLoading: entrepriseLoading } = useEntreprise();
  const { isAdmin } = useUserRole();
  const [taches, setTaches] = useState<Tache[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const fetchTaches = useCallback(async () => {
    if (!entrepriseId) return;

    // RLS will automatically filter based on role (admin sees all, agent sees assigned)
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

  const generateSuggestions = async () => {
    setIsGeneratingSuggestions(true);
    setSuggestions([]);

    try {
      const response = await supabase.functions.invoke("suggest-tasks", {
        body: {
          existingTasks: taches.map(t => ({ titre: t.titre, statut: t.statut })),
          context: "Agence immobilière en Guinée - gestion quotidienne",
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setSuggestions(response.data.suggestions || []);
      
      if (response.data.suggestions?.length > 0) {
        toast.success(`${response.data.suggestions.length} suggestions générées`);
      } else {
        toast.info("Aucune suggestion disponible pour le moment");
      }
    } catch (error) {
      console.error("Error generating suggestions:", error);
      toast.error("Erreur lors de la génération des suggestions");
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  const addSuggestionAsTask = async (suggestion: Suggestion) => {
    if (!entrepriseId) return;

    const { error } = await supabase.from("taches").insert({
      titre: suggestion.titre,
      description: suggestion.description,
      entreprise_id: entrepriseId,
      statut: "a_faire" as const,
      is_ai_generated: true,
    });

    if (error) {
      toast.error("Erreur lors de l'ajout de la tâche");
      return;
    }

    toast.success("Tâche ajoutée");
    setSuggestions(suggestions.filter(s => s.titre !== suggestion.titre));
    fetchTaches();
  };

  const getPriorityColor = (priorite: string) => {
    switch (priorite?.toLowerCase()) {
      case "haute":
        return "bg-destructive/10 text-destructive";
      case "moyenne":
        return "bg-warning/10 text-warning";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (entrepriseLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex relative">
      <FloatingParticles count={25} />
      <DynamicSidebar onSignOut={handleSignOut} />
      
      <main className="flex-1 ml-64 mesh-gradient min-h-screen p-8">
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-8 premium-header rounded-xl p-4"
          >
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Tâches</h1>
              <p className="text-muted-foreground">
                {isAdmin ? "Gérez les tâches de l'équipe" : "Vos tâches assignées"}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-end gap-2 mb-6"
          >
            {isAdmin && (
              <>
                <Button 
                  variant="outline" 
                  onClick={generateSuggestions}
                  disabled={isGeneratingSuggestions}
                  className="gap-2"
                >
                  {isGeneratingSuggestions ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  Suggestions IA
                </Button>
                <Button onClick={() => setDialogOpen(true)} className="premium-button">
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle tâche
                </Button>
              </>
            )}
          </motion.div>

          {/* AI Suggestions - Admin only */}
          {isAdmin && suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl border border-primary/30 bg-primary/5"
            >
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Suggestions IA</h3>
              </div>
              <div className="space-y-3">
                {suggestions.map((suggestion, index) => (
                  <div key={index} className="p-3 rounded-lg bg-background/50 flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{suggestion.titre}</span>
                        <Badge className={getPriorityColor(suggestion.priorite)}>
                          {suggestion.priorite}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                    </div>
                    <Button size="sm" onClick={() => addSuggestionAsTask(suggestion)}>
                      <Plus className="w-4 h-4 mr-1" />
                      Ajouter
                    </Button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-border/50 overflow-hidden premium-card"
          >
            {taches.length > 0 ? (
              <div className="divide-y divide-border/50">
                {taches.map((tache, index) => (
                  <motion.div 
                    key={tache.id} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 flex items-center gap-4 hover:bg-secondary/30 transition-colors premium-list-item"
                  >
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
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <CheckSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  {isAdmin ? "Aucune tâche pour le moment" : "Aucune tâche assignée"}
                </p>
              </div>
            )}
          </motion.div>
        </div>

        {entrepriseId && isAdmin && (
          <TacheDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            entrepriseId={entrepriseId}
            onSuccess={fetchTaches}
          />
        )}
      </main>
    </div>
  );
};

export default Taches;
