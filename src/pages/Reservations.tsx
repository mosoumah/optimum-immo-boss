import { useEffect, useState, useCallback } from "react";
import { CalendarCheck, Plus, LogIn, LogOut as LogOutIcon, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DynamicSidebar } from "@/components/DynamicSidebar";
import { FloatingParticles } from "@/components/FloatingParticles";
import { useAuth } from "@/hooks/useAuth";
import { useEntreprise } from "@/hooks/useEntreprise";
import { useRealtimeRefresh } from "@/hooks/useRealtimeRefresh";
import { supabase } from "@/integrations/supabase/client";
import { ReservationDialog } from "@/components/dialogs/ReservationDialog";
import { PaiementDialog } from "@/components/dialogs/PaiementDialog";
import { PermissionGate } from "@/components/PermissionGate";
import type { Database } from "@/integrations/supabase/types";
import { reservationTimes, toTimeInput } from "@/types/reservations";
import { formatDateGN, todayGN } from "@/lib/dateGuinee";

type Reservation = Database["public"]["Tables"]["reservations"]["Row"];

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

/** "14:30" -> "14h30" */
const toHourLabel = (value: string) => value.replace(":", "h");

/** Reste à payer d'une réservation (jamais négatif). */
const resteAPayer = (r: Reservation): number =>
  Math.max(Number(r.montant_total) - Number(r.montant_paye), 0);

/**
 * Créneau horaire d'une réservation à l'heure, quand les heures existent.
 * Renvoie " · 14h30 – 15h45", ou "" (jour/mensuel ou heures absentes).
 */
const hourRangeSuffix = (r: Reservation): string => {
  if (r.type_location !== "heure") return "";
  const times = reservationTimes(r);
  const debut = toTimeInput(times.heure_debut);
  const fin = toTimeInput(times.heure_fin);
  if (!debut || !fin) return "";
  return ` · ${toHourLabel(debut)} – ${toHourLabel(fin)}`;
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
  const [paiementReservation, setPaiementReservation] = useState<Reservation | null>(null);
  // Rendu progressif : 30 lignes d'abord, le reste à la demande.
  const [visibleCount, setVisibleCount] = useState(30);

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
    (clientsData || []).forEach((c) => { cMap[c.id] = c.nom; });
    setClientsMap(cMap);

    const pMap: Record<string, string> = {};
    (propsData || []).forEach((p) => { pMap[p.id] = p.nom; });
    setPropertiesMap(pMap);

    setIsLoading(false);
  }, [entrepriseId]);

  useEffect(() => {
    if (entrepriseId) fetchReservations();
  }, [entrepriseId, fetchReservations]);

  // Temps réel : un encaissement met à jour la réservation, crée le revenu et
  // solde la facture liée côté serveur.
  useRealtimeRefresh(entrepriseId, ["revenus", "reservations", "factures"], fetchReservations);

  const today = todayGN();
  const arriveesToday = reservations.filter((r) => r.date_arrivee === today && ["en_attente", "en_cours"].includes(r.statut)).length;
  const departsToday = reservations.filter((r) => r.date_depart === today && ["en_attente", "en_cours"].includes(r.statut)).length;
  const enCours = reservations.filter((r) => ["en_cours", "en_attente"].includes(r.statut) && r.date_arrivee <= today && r.date_depart >= today).length;
  

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("fr-GN", { style: "decimal", minimumFractionDigits: 0 }).format(amount) + " GNF";
  const formatDate = (date: string) => formatDateGN(date);

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

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {[
              { label: "Arrivées aujourd'hui", value: arriveesToday, Icon: LogIn },
              { label: "Départs aujourd'hui", value: departsToday, Icon: LogOutIcon },
              { label: "Séjours en cours", value: enCours, Icon: Clock },
              
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
              {/* Mobile : une carte par réservation (pas de tableau illisible). */}
              <div className="md:hidden divide-y divide-border/30">
                {reservations.slice(0, visibleCount).map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => { setEditingReservation(r); setDialogOpen(true); }}
                    className="w-full text-left p-3 active:bg-secondary/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">{clientsMap[r.client_id] || "—"}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {(r.property_id && propertiesMap[r.property_id]) || r.property_name}
                        </div>
                      </div>
                      <Badge className={`${statutColors[r.statut]} shrink-0`}>{statutLabels[r.statut] || r.statut}</Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span>{formatDate(r.date_arrivee)} → {formatDate(r.date_depart)}{hourRangeSuffix(r)}</span>
                    </div>
                    <div className="mt-2 flex items-end justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold amount">{formatCurrency(r.montant_total)}</div>
                        <div className="text-xs text-muted-foreground amount">
                          {resteAPayer(r) > 0
                            ? `Payé ${formatCurrency(Number(r.montant_paye))} · Reste ${formatCurrency(resteAPayer(r))}`
                            : "Soldée"}
                        </div>
                      </div>
                      {resteAPayer(r) > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPaiementReservation(r);
                          }}
                        >
                          Encaisser
                        </Button>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Tablette / ordinateur : tableau, défilement interne si besoin. */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-[720px]">
                  <thead className="bg-secondary/30">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium">Client</th>
                      <th className="text-left p-3 text-sm font-medium">Bien</th>
                      <th className="text-left p-3 text-sm font-medium">Dates</th>
                      <th className="text-left p-3 text-sm font-medium">Montant</th>
                      <th className="text-left p-3 text-sm font-medium">Statut</th>
                      <th className="text-left p-3 text-sm font-medium">Paiement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservations.slice(0, visibleCount).map((r) => (
                      <tr
                        key={r.id}
                        className="border-t border-border/30 hover:bg-secondary/20 cursor-pointer"
                        onClick={() => { setEditingReservation(r); setDialogOpen(true); }}
                      >
                        <td className="p-3 text-sm">{clientsMap[r.client_id] || "—"}</td>
                        <td className="p-3 text-sm">{(r.property_id && propertiesMap[r.property_id]) || r.property_name}</td>
                        <td className="p-3 text-sm">{formatDate(r.date_arrivee)} → {formatDate(r.date_depart)}{hourRangeSuffix(r)}</td>
                        <td className="p-3 text-sm">
                          <div className="amount">{formatCurrency(r.montant_total)}</div>
                          <div className="text-xs text-muted-foreground amount">
                            {resteAPayer(r) > 0
                              ? `Payé ${formatCurrency(Number(r.montant_paye))} · Reste ${formatCurrency(resteAPayer(r))}`
                              : "Soldée"}
                          </div>
                        </td>
                        <td className="p-3"><Badge className={statutColors[r.statut]}>{statutLabels[r.statut] || r.statut}</Badge></td>
                        <td className="p-3 text-sm">
                          {resteAPayer(r) > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-9 px-2 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPaiementReservation(r);
                              }}
                            >
                              Encaisser
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {reservations.length > visibleCount && (
                <div className="p-3 text-center border-t border-border/30">
                  <Button variant="outline" size="sm" onClick={() => setVisibleCount((count) => count + 30)}>
                    Afficher plus ({reservations.length - visibleCount} restantes)
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <ReservationDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          reservation={editingReservation}
          onSuccess={fetchReservations}
        />

        <PaiementDialog
          open={paiementReservation !== null}
          onOpenChange={(open) => { if (!open) setPaiementReservation(null); }}
          reservation={paiementReservation}
          contexte={
            paiementReservation
              ? `${(paiementReservation.property_id && propertiesMap[paiementReservation.property_id]) || paiementReservation.property_name}`
              : undefined
          }
          onSuccess={fetchReservations}
        />
      </main>
    </div>
  );
};

export default Reservations;
