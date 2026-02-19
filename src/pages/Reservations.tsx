import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { CalendarCheck, LogIn, LogOut, Home, AlertTriangle, Plus, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DynamicSidebar } from "@/components/DynamicSidebar";
import { FloatingParticles } from "@/components/FloatingParticles";
import { ReservationDialog } from "@/components/dialogs/ReservationDialog";
import { supabase } from "@/integrations/supabase/client";
import { useEntreprise } from "@/hooks/useEntreprise";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Reservation {
  id: string;
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
  notes: string | null;
  created_at: string;
}

const statutColors: Record<string, string> = {
  en_attente: "bg-warning/20 text-warning",
  confirmee: "bg-blue-500/20 text-blue-400",
  en_cours: "bg-success/20 text-success",
  terminee: "bg-muted text-muted-foreground",
  annulee: "bg-destructive/20 text-destructive",
};

const statutLabels: Record<string, string> = {
  en_attente: "En attente",
  confirmee: "Confirmée",
  en_cours: "En cours",
  terminee: "Terminée",
  annulee: "Annulée",
};

const Reservations = () => {
  const { signOut } = useAuth();
  const { entrepriseId } = useEntreprise();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [clientNames, setClientNames] = useState<Record<string, string>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editReservation, setEditReservation] = useState<any>(null);
  const [stats, setStats] = useState({ arrivees: 0, departs: 0, enCours: 0, retards: 0 });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("fr-GN", { style: "decimal", minimumFractionDigits: 0 }).format(amount) + " GNF";

  const fetchData = useCallback(async () => {
    if (!entrepriseId) return;
    const today = format(new Date(), "yyyy-MM-dd");

    const { data: resData } = await supabase
      .from("reservations" as any)
      .select("*")
      .eq("entreprise_id", entrepriseId)
      .order("created_at", { ascending: false });

    const list = (resData || []) as unknown as Reservation[];
    setReservations(list);

    // Fetch client names
    const clientIds = [...new Set(list.map((r) => r.client_id))];
    if (clientIds.length > 0) {
      const { data: clientsData } = await supabase
        .from("clients")
        .select("id, nom")
        .in("id", clientIds);
      const map: Record<string, string> = {};
      (clientsData || []).forEach((c: any) => (map[c.id] = c.nom));
      setClientNames(map);
    }

    // Stats
    const arrivees = list.filter((r) => r.date_arrivee === today && ["confirmee", "en_cours"].includes(r.statut)).length;
    const departs = list.filter((r) => r.date_depart === today).length;
    const enCours = list.filter((r) => r.statut === "en_cours").length;
    const retards = list.filter((r) => r.montant_paye < r.montant_total && r.date_depart < today && r.statut === "terminee").length;
    setStats({ arrivees, departs, enCours, retards });
  }, [entrepriseId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("reservations" as any).delete().eq("id", id);
    if (error) {
      toast.error("Erreur lors de la suppression");
    } else {
      toast.success("Réservation supprimée");
      fetchData();
    }
  };

  const handleEdit = (r: Reservation) => {
    setEditReservation(r);
    setDialogOpen(true);
  };

  const statCards = [
    { icon: LogIn, label: "Arrivées aujourd'hui", value: stats.arrivees, color: "text-blue-400" },
    { icon: LogOut, label: "Départs aujourd'hui", value: stats.departs, color: "text-primary" },
    { icon: Home, label: "Séjours en cours", value: stats.enCours, color: "text-success" },
    { icon: AlertTriangle, label: "Paiements en retard", value: stats.retards, color: "text-warning" },
  ];

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <DynamicSidebar onSignOut={signOut} />
      <FloatingParticles />
      <main className="flex-1 overflow-y-auto lg:ml-64">
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <CalendarCheck className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Réservations</h1>
                <p className="text-muted-foreground text-sm">Gestion des locations</p>
              </div>
            </div>
            <Button onClick={() => { setEditReservation(null); setDialogOpen(true); }} className="gap-2">
              <Plus className="w-4 h-4" /> Nouvelle réservation
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {statCards.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 rounded-xl border border-border/50 bg-card"
              >
                <div className="flex items-center gap-2 mb-2">
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                </div>
                <div className="text-2xl font-bold">{s.value}</div>
              </motion.div>
            ))}
          </div>

          {/* Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl border border-border/50 bg-card overflow-hidden"
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Bien</TableHead>
                  <TableHead>Arrivée</TableHead>
                  <TableHead>Départ</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                      Aucune réservation pour le moment
                    </TableCell>
                  </TableRow>
                ) : (
                  reservations.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{clientNames[r.client_id] || "—"}</TableCell>
                      <TableCell>{r.property_name}</TableCell>
                      <TableCell>{format(new Date(r.date_arrivee), "dd/MM/yyyy")}</TableCell>
                      <TableCell>{format(new Date(r.date_depart), "dd/MM/yyyy")}</TableCell>
                      <TableCell>{formatCurrency(r.montant_total)}</TableCell>
                      <TableCell>
                        <Badge className={statutColors[r.statut]}>{statutLabels[r.statut]}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(r)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)} className="hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </motion.div>
        </div>
      </main>

      <ReservationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        reservation={editReservation}
        onSuccess={fetchData}
      />
    </div>
  );
};

export default Reservations;
