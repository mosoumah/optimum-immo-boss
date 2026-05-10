import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckSquare, Plus, ArrowLeft, Check, Sparkles, Loader2, MessageCircle, Mail, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { FloatingParticles } from "@/components/FloatingParticles";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useEntreprise } from "@/hooks/useEntreprise";
import { usePermissions } from "@/hooks/usePermissions";
import { PermissionGate } from "@/components/PermissionGate";
import { useAuth } from "@/hooks/useAuth";
import { TacheDialog } from "@/components/dialogs/TacheDialog";
import { TacheDetailDialog } from "@/components/dialogs/TacheDetailDialog";
import { DirectMessagePanel } from "@/components/DirectMessagePanel";
import { DynamicSidebar } from "@/components/DynamicSidebar";
import { toast } from "sonner";
import { checkPermission } from "@/lib/checkPermission";

interface Tache {
  id: string;
  titre: string;
  description: string | null;
  statut: string;
  date: string;
  is_ai_generated: boolean | null;
  assigned_to: string | null;
  assignee_name?: string;
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
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const [taches, setTaches] = useState<Tache[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [messagePanelOpen, setMessagePanelOpen] = useState(false);
  const [selectedTache, setSelectedTache] = useState<Tache | null>(null);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const fetchTaches = useCallback(async () => {
    if (!entrepriseId) return;

    // Fetch tasks
    const { data: tachesData } = await supabase
      .from("taches")
      .select("*")
      .eq("entreprise_id", entrepriseId)
      .order("date", { ascending: false });

    if (!tachesData) {
      setTaches([]);
      setIsLoading(false);
      return;
    }

    // Fetch assignee names for tasks with assigned_to
    const assignedUserIds = [...new Set(tachesData.filter(t => t.assigned_to).map(t => t.assigned_to!))];
    
    let profilesMap = new Map<string, string>();
    if (assignedUserIds.length > 0) {
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, nom")
        .in("id", assignedUserIds);
      
      profilesMap = new Map((profilesData || []).map(p => [p.id, p.nom]));
    }

    const tachesWithNames = tachesData.map(t => ({
      ...t,
      assignee_name: t.assigned_to ? profilesMap.get(t.assigned_to) || undefined : undefined,
    }));

    setTaches(tachesWithNames);
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
    // Check permission before modifying
    const canModify = await checkPermission("modifier_tache");
    if (!canModify) {
      toast.error("Vous n'avez pas la permission de modifier les tâches");
      return;
    }
    
    const newStatut = tache.statut === "a_faire" ? "fait" : "a_faire";
    await supabase
      .from("taches")
      .update({ statut: newStatut })
      .eq("id", tache.id);

    setTaches(taches.map(t => t.id === tache.id ? { ...t, statut: newStatut } : t));
  };

  const supprimerTache = async (tache: Tache) => {
    const canDelete = await checkPermission("supprimer_tache");
    if (!canDelete) {
      toast.error("Vous n'avez pas la permission de supprimer les tâches");
      return;
    }

    const { error } = await supabase.from("taches").delete().eq("id", tache.id);

    if (error) {
      toast.error("Erreur lors de la suppression");
      return;
    }

    toast.success("Tâche supprimée avec succès");
    setTaches(taches.filter(t => t.id !== tache.id));
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

  if (entrepriseLoading || isLoading || permissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex relative overflow-hidden">
      <FloatingParticles count={25} />
      <DynamicSidebar onSignOut={handleSignOut} />
      
      <main className="flex-1 mesh-gradient h-screen overflow-y-auto lg:ml-64">
        <div className="p-4 lg:p-8">
          <div className="max-w-6xl mx-auto relative z-10 w-full">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8 premium-header rounded-xl p-3 sm:p-4"
          >
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-3xl font-bold">Tâches</h1>
              <p className="text-sm sm:text-base text-muted-foreground truncate">
                {hasPermission("creer_tache") ? "Gérez les tâches de l'équipe" : "Vos tâches assignées"}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap justify-end gap-2 mb-6"
          >
            <Button
              variant="outline"
              onClick={() => setMessagePanelOpen(true)}
              className="gap-2"
              size="sm"
            >
              <Mail className="w-4 h-4" />
              <span className="hidden md:inline">Messagerie</span>
            </Button>
            <PermissionGate permission="creer_tache">
              <Button 
                variant="outline" 
                onClick={generateSuggestions}
                disabled={isGeneratingSuggestions}
                className="gap-2"
                size="sm"
              >
                {isGeneratingSuggestions ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span className="hidden md:inline">Suggestions IA</span>
              </Button>
              <Button onClick={() => setDialogOpen(true)} className="premium-button" size="sm">
                <Plus className="w-4 h-4 sm:mr-2" />
                <span className="hidden md:inline">Nouvelle tâche</span>
              </Button>
            </PermissionGate>
          </motion.div>

          {/* AI Suggestions */}
          <PermissionGate permission="creer_tache">
            {suggestions.length > 0 && (
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
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-medium break-words">{suggestion.titre}</span>
                          <Badge className={getPriorityColor(suggestion.priorite)}>
                            {suggestion.priorite}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground break-words">{suggestion.description}</p>
                      </div>
                      <Button size="sm" onClick={() => addSuggestionAsTask(suggestion)} className="shrink-0">
                        <Plus className="w-4 h-4 mr-1" />
                        Ajouter
                      </Button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </PermissionGate>

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
                    className="p-4 flex items-center gap-2 sm:gap-4 hover:bg-secondary/30 transition-colors premium-list-item cursor-pointer overflow-hidden"
                    onClick={() => {
                      setSelectedTache(tache);
                      setDetailDialogOpen(true);
                    }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStatut(tache);
                      }}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        tache.statut === "fait"
                          ? "bg-success border-success"
                          : "border-muted-foreground hover:border-primary"
                      }`}
                    >
                      {tache.statut === "fait" && <Check className="w-4 h-4 text-white" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium break-words ${tache.statut === "fait" ? "line-through text-muted-foreground" : ""}`}>
                        {tache.titre}
                      </div>
                      {tache.description && (
                        <div className="text-sm text-muted-foreground truncate">{tache.description}</div>
                      )}
                      {tache.assignee_name && (
                        <div className="text-xs text-muted-foreground mt-1 truncate min-w-0">
                          Assignée à: {tache.assignee_name}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <MessageCircle className="w-4 h-4 text-muted-foreground" />
                      {tache.is_ai_generated && (
                        <Badge variant="outline" className="text-xs">IA</Badge>
                      )}
                      <span className="text-sm text-muted-foreground whitespace-nowrap hidden sm:inline">{formatDate(tache.date)}</span>
                      <PermissionGate permission="supprimer_tache">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Supprimer cette tâche ?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Cette action est irréversible. La tâche sera définitivement supprimée.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Annuler</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  supprimerTache(tache);
                                }}
                              >
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </PermissionGate>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <CheckSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  {hasPermission("creer_tache") ? "Aucune tâche pour le moment" : "Aucune tâche assignée"}
                </p>
              </div>
            )}
          </motion.div>
        </div>

        <PermissionGate permission="creer_tache">
          {entrepriseId && (
            <TacheDialog
              open={dialogOpen}
              onOpenChange={setDialogOpen}
              entrepriseId={entrepriseId}
              onSuccess={fetchTaches}
            />
          )}
        </PermissionGate>

        <TacheDetailDialog
          open={detailDialogOpen}
          onOpenChange={setDetailDialogOpen}
          tache={selectedTache}
        />

        <DirectMessagePanel
          open={messagePanelOpen}
          onOpenChange={setMessagePanelOpen}
        />
        </div>
      </main>
    </div>
  );
};

export default Taches;
