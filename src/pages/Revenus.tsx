import { useEffect, useState, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { TrendingUp, ArrowLeft, Plus, Calendar, CalendarDays, CalendarRange, List, Trash2 } from "lucide-react";
import { FloatingParticles } from "@/components/FloatingParticles";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useEntreprise } from "@/hooks/useEntreprise";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { PermissionGate } from "@/components/PermissionGate";
import { RevenuDialog } from "@/components/dialogs/RevenuDialog";
import { DynamicSidebar } from "@/components/DynamicSidebar";
import { useUserRole } from "@/hooks/useUserRole";
import { isToday, isThisWeek, isThisMonth } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface Revenu {
  id: string;
  montant: number;
  date: string;
  source: string | null;
  facture_id: string | null;
  factures: { description: string | null; date: string; clients: { nom: string } | null } | null;
}

type FilterPeriod = 'today' | 'week' | 'month' | 'all';

const filterLabels: Record<FilterPeriod, { label: string; icon: React.ReactNode }> = {
  today: { label: "Aujourd'hui", icon: <Calendar className="w-4 h-4" /> },
  week: { label: "Semaine", icon: <CalendarDays className="w-4 h-4" /> },
  month: { label: "Mois", icon: <CalendarRange className="w-4 h-4" /> },
  all: { label: "Tout", icon: <List className="w-4 h-4" /> },
};

const Revenus = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { entrepriseId, isLoading: entrepriseLoading } = useEntreprise();
  const [revenus, setRevenus] = useState<Revenu[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('month');
  const { loading: permissionsLoading } = usePermissions();
  const { isAdmin } = useUserRole();
  const [selectedRevenu, setSelectedRevenu] = useState<Revenu | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const fetchRevenus = useCallback(async () => {
    if (!entrepriseId) return;

    const { data } = await supabase
      .from("revenus")
      .select("*, factures(description, date, clients(nom))")
      .eq("entreprise_id", entrepriseId)
      .order("date", { ascending: false });

    setRevenus((data as Revenu[]) || []);
    setIsLoading(false);
  }, [entrepriseId]);

  useEffect(() => {
    if (entrepriseId) {
      fetchRevenus();
    }
  }, [entrepriseId, fetchRevenus]);

  const filterByPeriod = useCallback((dateStr: string, period: FilterPeriod): boolean => {
    if (!dateStr) return false;
    const parsedDate = new Date(dateStr);
    if (isNaN(parsedDate.getTime())) return false;
    
    switch (period) {
      case 'today':
        return isToday(parsedDate);
      case 'week':
        return isThisWeek(parsedDate, { weekStartsOn: 1 });
      case 'month':
        return isThisMonth(parsedDate);
      case 'all':
        return true;
      default:
        return true;
    }
  }, []);

  const filteredRevenus = useMemo(() => {
    return revenus.filter((r) => {
      const effectiveDate = r.factures?.date || r.date;
      return filterByPeriod(effectiveDate, filterPeriod);
    });
  }, [revenus, filterPeriod, filterByPeriod]);

  const totalFiltered = useMemo(() => {
    return filteredRevenus.reduce((sum, r) => sum + Number(r.montant), 0);
  }, [filteredRevenus]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-GN").format(amount) + " GNF";
  };

  const formatDate = (revenu: Revenu) => {
    const effectiveDate = revenu.factures?.date || revenu.date;
    return new Date(effectiveDate).toLocaleDateString("fr-FR");
  };

  const getRevenuTitle = (revenu: Revenu) => {
    if (revenu.facture_id && revenu.factures?.clients?.nom) {
      return revenu.factures.clients.nom;
    }
    return "Revenu";
  };

  const getRevenuSubtitle = (revenu: Revenu) => {
    if (revenu.facture_id && revenu.factures?.description) {
      return revenu.factures.description;
    }
    if (revenu.facture_id) {
      return "Paiement facture";
    }
    return revenu.source || "—";
  };

  const handleRevenuClick = (revenu: Revenu) => {
    setSelectedRevenu(revenu);
    setDetailOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedRevenu) return;
    setDeleting(true);
    const { error } = await supabase.from("revenus").delete().eq("id", selectedRevenu.id);
    setDeleting(false);
    if (error) {
      toast.error("Erreur lors de la suppression");
      return;
    }
    toast.success("Revenu supprimé");
    setDetailOpen(false);
    setSelectedRevenu(null);
    fetchRevenus();
  };

  if (entrepriseLoading || isLoading || permissionsLoading) {
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
            <h1 className="text-3xl font-bold">Revenus</h1>
            <p className="text-muted-foreground">Suivez vos revenus</p>
          </div>
        </motion.div>

        {/* Filter Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-2 mb-6"
        >
          {(Object.keys(filterLabels) as FilterPeriod[]).map((period) => (
            <Button
              key={period}
              variant={filterPeriod === period ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterPeriod(period)}
              className={`transition-all ${filterPeriod === period ? "premium-button shadow-lg" : "hover:bg-secondary/50"}`}
            >
              {filterLabels[period].icon}
              <span className="ml-2">{filterLabels[period].label}</span>
            </Button>
          ))}
        </motion.div>

        {/* Total Widget */}
        <motion.div
          key={`total-${filterPeriod}-${totalFiltered}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-xl card-gradient border border-border/50 mb-6 premium-card"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Total {filterLabels[filterPeriod].label.toLowerCase()}
              </p>
              <p className="text-3xl font-bold text-success">{formatCurrency(totalFiltered)}</p>
            </div>
            <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-success" />
            </div>
          </div>
        </motion.div>

        <PermissionGate permission="ajouter_revenu">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-end mb-6"
          >
            <Button onClick={() => setDialogOpen(true)} className="premium-button">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un revenu
            </Button>
          </motion.div>
        </PermissionGate>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-border/50 overflow-hidden premium-card"
        >
          {filteredRevenus.length > 0 ? (
            <div className="divide-y divide-border/50">
              {filteredRevenus.map((revenu, index) => (
                <motion.div 
                  key={revenu.id} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 flex items-center gap-4 hover:bg-secondary/30 transition-colors premium-list-item cursor-pointer"
                  onClick={() => handleRevenuClick(revenu)}
                >
                  <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-success" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{getRevenuTitle(revenu)}</div>
                    <div className="text-sm text-muted-foreground">{getRevenuSubtitle(revenu)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-success">+{formatCurrency(revenu.montant)}</div>
                    <div className="text-sm text-muted-foreground">{formatDate(revenu)}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Aucun revenu pour cette période</p>
            </div>
          )}
        </motion.div>
      </div>

      {entrepriseId && (
        <RevenuDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          entrepriseId={entrepriseId}
          onSuccess={fetchRevenus}
        />
      )}

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détails du revenu</DialogTitle>
            <DialogDescription>Informations sur ce revenu</DialogDescription>
          </DialogHeader>
          {selectedRevenu && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium">{selectedRevenu.facture_id ? "Facture" : "Manuel"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Montant</p>
                  <p className="font-medium text-success">{formatCurrency(selectedRevenu.montant)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{formatDate(selectedRevenu)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {selectedRevenu.facture_id ? "Client" : "Source"}
                  </p>
                  <p className="font-medium">
                    {selectedRevenu.facture_id
                      ? selectedRevenu.factures?.clients?.nom || "—"
                      : selectedRevenu.source || "—"}
                  </p>
                </div>
              </div>
              {selectedRevenu.facture_id && selectedRevenu.factures?.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Description facture</p>
                  <p className="font-medium">{selectedRevenu.factures.description}</p>
                </div>
              )}
              {isAdmin && (
                <div className="pt-4 border-t border-border/50">
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="w-full"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {deleting ? "Suppression..." : "Supprimer ce revenu"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      </main>
    </div>
  );
};

export default Revenus;
