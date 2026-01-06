import { useEffect, useState, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { TrendingDown, Plus, ArrowLeft, Calendar, CalendarDays, CalendarRange, List } from "lucide-react";
import { FloatingParticles } from "@/components/FloatingParticles";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useEntreprise } from "@/hooks/useEntreprise";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { PermissionGate } from "@/components/PermissionGate";
import { DepenseDialog } from "@/components/dialogs/DepenseDialog";
import { DynamicSidebar } from "@/components/DynamicSidebar";
import { isToday, isThisWeek, isThisMonth } from "date-fns";

interface Depense {
  id: string;
  description: string;
  montant: number;
  date: string;
}

type FilterPeriod = 'today' | 'week' | 'month' | 'all';

const filterLabels: Record<FilterPeriod, { label: string; icon: React.ReactNode }> = {
  today: { label: "Aujourd'hui", icon: <Calendar className="w-4 h-4" /> },
  week: { label: "Semaine", icon: <CalendarDays className="w-4 h-4" /> },
  month: { label: "Mois", icon: <CalendarRange className="w-4 h-4" /> },
  all: { label: "Tout", icon: <List className="w-4 h-4" /> },
};

const Depenses = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { entrepriseId, isLoading: entrepriseLoading } = useEntreprise();
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('month');
  const { loading: permissionsLoading } = usePermissions();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const fetchDepenses = useCallback(async () => {
    if (!entrepriseId) return;

    const { data } = await supabase
      .from("depenses")
      .select("*")
      .eq("entreprise_id", entrepriseId)
      .order("date", { ascending: false });

    setDepenses(data || []);
    setIsLoading(false);
  }, [entrepriseId]);

  useEffect(() => {
    if (entrepriseId) {
      fetchDepenses();
    }
  }, [entrepriseId, fetchDepenses]);

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

  const filteredDepenses = useMemo(() => {
    return depenses.filter((d) => filterByPeriod(d.date, filterPeriod));
  }, [depenses, filterPeriod, filterByPeriod]);

  const totalFiltered = useMemo(() => {
    return filteredDepenses.reduce((sum, d) => sum + Number(d.montant), 0);
  }, [filteredDepenses]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-GN").format(amount) + " GNF";
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-FR");
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
            <h1 className="text-3xl font-bold">Dépenses</h1>
            <p className="text-muted-foreground">Suivez vos dépenses</p>
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
              <p className="text-3xl font-bold text-destructive">{formatCurrency(totalFiltered)}</p>
            </div>
            <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
              <TrendingDown className="w-7 h-7 text-destructive" />
            </div>
          </div>
        </motion.div>

        <PermissionGate permission="ajouter_depense">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-end mb-6"
          >
            <Button onClick={() => setDialogOpen(true)} className="premium-button">
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle dépense
            </Button>
          </motion.div>
        </PermissionGate>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-border/50 overflow-hidden premium-card"
        >
          {filteredDepenses.length > 0 ? (
            <div className="divide-y divide-border/50">
              {filteredDepenses.map((depense, index) => (
                <motion.div 
                  key={depense.id} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 flex items-center gap-4 hover:bg-secondary/30 transition-colors premium-list-item"
                >
                  <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                    <TrendingDown className="w-6 h-6 text-destructive" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{depense.description}</div>
                    <div className="text-sm text-muted-foreground">{formatDate(depense.date)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-destructive">-{formatCurrency(depense.montant)}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <TrendingDown className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Aucune dépense pour cette période</p>
            </div>
          )}
        </motion.div>
      </div>

      {entrepriseId && (
        <DepenseDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          entrepriseId={entrepriseId}
          onSuccess={fetchDepenses}
        />
      )}
      </main>
    </div>
  );
};

export default Depenses;
