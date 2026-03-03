import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { CalendarCheck, Plus, LogIn, LogOut as LogOutIcon, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DynamicSidebar } from "@/components/DynamicSidebar";
import { FloatingParticles } from "@/components/FloatingParticles";
import { useAuth } from "@/hooks/useAuth";
import { useEntreprise } from "@/hooks/useEntreprise";
import { supabase } from "@/integrations/supabase/client";
import { ReservationDialog } from "@/components/dialogs/ReservationDialog";
import { PermissionGate } from "@/components/PermissionGate";

interface Reservation {
  id: string;
  property_name: string;
  property_id: string | null;
  type_location: string;
  date_arrivee: string;
  date_depart: string;
  montant_total: number;
  montant_paye: number;
  statut: string;
  client_id: string;
}

const statutColors: Record<string, string> = {
  en_attente: "bg-muted text-muted-foreground",
  en_cours: "bg-success/20 text-success",
  terminee: "bg-purple-500/20 text-purple-400",
  annulee: "bg-destructive/20 text-destructive",
};

const statutLabels: Record<string, string> = {
  en_attente: "En attente",
  en_cours: "En cours",
  terminee: "Terminée",
  annulee: "Annulée",
};

const Reservations = () => {
  const { signOut } = useAuth();
  const { entrepriseId } = useEntreprise();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [clientsMap, setClientsMap] = useState<Record<string, string>>({});
  const [propertiesMap, setPropertiesMap] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);

  const fetchReservations = useCallback(async () => {
    if (!entrepriseId) return;

    // Auto-complete expired reservations before fetching
    await supabase.rpc("auto_complete_reservations", { _entreprise_id: entrepriseId });

    const [{ data: resData }, { data: clientsData }, { data: propsData }] = await Promise.all([
      supabase
        .from("reservations")
        .select("*")
        .eq("entreprise_id", entrepriseId)
        .order("date_arrivee", { ascending: false }),
      supabase.from("clients").select("id, nom").eq("entreprise_id", entrepriseId),
      supabase.from("properties").select("id, nom").eq("entreprise_id", entrepriseId),
    ]);

    setReservations((resData as Reservation[]) || []);

    const cMap: Record<string, string> = {};
    (clientsData || []).forEach((c: any) => { cMap[c.id] = c.nom; });
    setClientsMap(cMap);

    const pMap: Record<string, string> = {};
    (propsData || []).forEach((p: any) => { pMap[p.id] = p.nom; });
    setPropertiesMap(pMap);

    setIsLoading(false);
  }, [entrepriseId]);

  useEffect(() => {
    if (entrepriseId) fetchReservations();
  }, [entrepriseId, fetchReservations]);

  const today = new Date().toISOString().split("T")[0];
  const arriveesToday = reservations.filter((r) => r.date_arrivee === today && ["en_attente", "en_cours"].includes(r.statut)).length;
  const departsToday = reservations.filter((r) => r.date_depart === today && ["en_attente", "en_cours"].includes(r.statut)).length;
  const enCours = reservations.filter((r) => ["en_cours", "en_attente"].includes(r.statut) && r.date_arrivee <= today && r.date_depart >= today).length;
  const paiementsRetard = reservations.filter((r) => r.montant_paye < r.montant_total && r.date_depart < today && r.statut === "terminee").length;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("fr-GN", { style: "decimal", minimumFractionDigits: 0 }).format(amount) + " GNF";
  const formatDate = (date: string) => new Date(date).toLocaleDateString("fr-FR");

  return (
    <div className="min-h-screen bg-background flex">
      <FloatingParticles />
      <DynamicSidebar onSignOut={signOut} />
      <main className="flex-1 lg:ml-64 p-4 md:p-8 pt-16 lg:pt-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold">Réservations</h1>
              <p className="text-muted-foreground">Gestion des locations</p>
            </div>
            <PermissionGate permission="creer_reservation">
              <Button onClick={() => { setEditingReservation(null); setDialogOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" />Nouvelle réservation
              </Button>
            </PermissionGate>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Arrivées aujourd'hui", value: arriveesToday, Icon: LogIn },
              { label: "Départs aujourd'hui", value: departsToday, Icon: LogOutIcon },
              { label: "Séjours en cours", value: enCours, Icon: Clock },
              { label: "Paiements en retard", value: paiementsRetard, Icon: AlertCircle },
            ].map(({ label, value, Icon }) => (
              <div key={label} className="p-4 rounded-xl border border-border/50 bg-card">
                <div className="flex items-center gap-2 mb-2"><Icon className="w-4 h-4 text-primary" /><span className="text-xs text-muted-foreground">{label}</span></div>
                <div className="text-2xl font-bold">{value}</div>
              </div>
            ))}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : reservations.length === 0 ? (
            <div className="text-center py-20">
              <CalendarCheck className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Aucune réservation</h3>
              <p className="text-muted-foreground">Créez votre première réservation</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border/50 overflow-hidden">
              <table className="w-full">
                <thead className="bg-secondary/30">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium">Client</th>
                    <th className="text-left p-3 text-sm font-medium">Bien</th>
                    <th className="text-left p-3 text-sm font-medium hidden md:table-cell">Dates</th>
                    <th className="text-left p-3 text-sm font-medium hidden md:table-cell">Montant</th>
                    <th className="text-left p-3 text-sm font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((r) => (
                    <tr
                      key={r.id}
                      className="border-t border-border/30 hover:bg-secondary/20 cursor-pointer"
                      onClick={() => { setEditingReservation(r); setDialogOpen(true); }}
                    >
                      <td className="p-3 text-sm">{clientsMap[r.client_id] || "—"}</td>
                      <td className="p-3 text-sm">{(r.property_id && propertiesMap[r.property_id]) || r.property_name}</td>
                      <td className="p-3 text-sm hidden md:table-cell">{formatDate(r.date_arrivee)} → {formatDate(r.date_depart)}</td>
                      <td className="p-3 text-sm hidden md:table-cell">{formatCurrency(r.montant_total)}</td>
                      <td className="p-3"><Badge className={statutColors[r.statut]}>{statutLabels[r.statut] || r.statut}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <ReservationDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          reservation={editingReservation}
          onSuccess={fetchReservations}
        />
      </main>
    </div>
  );
};

export default Reservations;
