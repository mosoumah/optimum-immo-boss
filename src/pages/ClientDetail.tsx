import { useEffect, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, ArrowLeft, FileText, Receipt, Mail, Phone, CalendarCheck, Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useEntreprise } from "@/hooks/useEntreprise";
import { useAgencySettings } from "@/hooks/useAgencySettings";
import type { Database } from "@/integrations/supabase/types";

type ReservationRow = Pick<Database["public"]["Tables"]["reservations"]["Row"],
  "id" | "property_name" | "date_arrivee" | "date_depart" | "montant_total" | "statut"
>;
interface TransactionRow {
  id: string;
  montant_vente: number;
  date_vente: string;
  statut: string;
  property_name?: string;
}

interface Client {
  id: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  created_at: string;
}

interface Facture {
  id: string;
  description: string | null;
  montant: number;
  statut: string;
  date: string;
}

const statutColors: Record<string, string> = {
  brouillon: "bg-muted text-muted-foreground",
  envoye: "bg-blue-500/20 text-blue-400",
  accepte: "bg-success/20 text-success",
  refuse: "bg-destructive/20 text-destructive",
  paye: "bg-success/20 text-success",
  non_paye: "bg-warning/20 text-warning",
  en_attente: "bg-muted text-muted-foreground",
  en_cours: "bg-success/20 text-success",
  terminee: "bg-purple-500/20 text-purple-400",
  annulee: "bg-destructive/20 text-destructive",
};

const statutLabels: Record<string, string> = {
  brouillon: "Brouillon",
  envoye: "Envoyé",
  accepte: "Accepté",
  refuse: "Refusé",
  paye: "Payée",
  non_paye: "Non payée",
  en_attente: "En attente",
  en_cours: "En cours",
  terminee: "Terminée",
  annulee: "Annulée",
};

const ClientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { entrepriseId, isLoading: entrepriseLoading } = useEntreprise();
  const { venteEnabled, locationEnabled } = useAgencySettings();
  const [client, setClient] = useState<Client | null>(null);
  const [devis, setDevis] = useState<Devis[]>([]);
  const [factures, setFactures] = useState<Facture[]>([]);
  const [reservations, setReservations] = useState<ReservationRow[]>([]);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchClientData = useCallback(async () => {
    if (!entrepriseId || !id) return;

    const clientRes = await supabase.from("clients").select("*").eq("id", id).eq("entreprise_id", entrepriseId).maybeSingle();
    const devisRes = await supabase.from("devis").select("id, description, montant, statut, date").eq("client_id", id).order("date", { ascending: false });
    const facturesRes = await supabase.from("factures").select("id, description, montant, statut, date").eq("client_id", id).order("date", { ascending: false });

    setClient(clientRes.data);
    setDevis(devisRes.data || []);
    setFactures(facturesRes.data || []);

    if (locationEnabled) {
      const resRes = await supabase.from("reservations").select("id, property_name, date_arrivee, date_depart, montant_total, statut").eq("client_id", id).order("date_arrivee", { ascending: false });
      setReservations(resRes.data || []);
    }
    if (venteEnabled) {
      const transRes = await supabase.from("sales_transactions").select("id, montant_vente, date_vente, statut, property_id").eq("client_id", id).order("date_vente", { ascending: false });
      type TransRow = { id: string; montant_vente: number | null; date_vente: string | null; statut: string | null; property_id: string | null; property_name?: string };
      const transData: TransRow[] = (transRes.data || []) as TransRow[];
      // Enrich with property names
      if (transData.length > 0) {
        const propIds = [...new Set(transData.map(t => t.property_id).filter(Boolean))];
        if (propIds.length > 0) {
          const { data: props } = await supabase.from("properties").select("id, nom").in("id", propIds);
          const propMap = new Map((props || []).map(p => [p.id, p.nom]));
          transData.forEach(t => { t.property_name = propMap.get(t.property_id) || "—"; });
        }
      }
      setTransactions(transData);
    }

    setIsLoading(false);
  }, [entrepriseId, id, locationEnabled, venteEnabled]);

  useEffect(() => {
    if (entrepriseId && id) {
      fetchClientData();
    }
  }, [entrepriseId, id, fetchClientData]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-FR");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-GN", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + " GNF";
  };

  if (entrepriseLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 pb-24 lg:pb-8">
        <div className="max-w-6xl mx-auto text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Client non trouvé</h1>
          <p className="text-muted-foreground mb-6">Ce client n'existe pas ou vous n'avez pas accès.</p>
          <Button asChild>
            <Link to="/clients">Retour aux clients</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 pb-24 lg:pb-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/clients">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{client.nom}</h1>
            <p className="text-muted-foreground">Fiche client</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-1 p-6 rounded-xl border border-border/50 bg-card"
          >
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-primary">
                {client.nom.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
              </span>
            </div>
            <h2 className="text-xl font-semibold text-center mb-4">{client.nom}</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>{client.email || "Pas d'email"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{client.telephone || "Pas de téléphone"}</span>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-border/50 text-sm text-muted-foreground">
              Client depuis le {formatDate(client.created_at)}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-6"
          >
            <div className="p-6 rounded-xl border border-border/50 bg-card">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Devis ({devis.length})</h3>
              </div>
              {devis.length > 0 ? (
                <div className="space-y-2">
                  {devis.map((d) => (
                    <div key={d.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                      <div>
                        <div className="font-medium text-sm">{d.description || "Sans description"}</div>
                        <div className="text-xs text-muted-foreground">{formatDate(d.date)}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{formatCurrency(d.montant)}</span>
                        <Badge className={statutColors[d.statut]}>{statutLabels[d.statut]}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Aucun devis pour ce client</p>
              )}
            </div>

            <div className="p-6 rounded-xl border border-border/50 bg-card">
              <div className="flex items-center gap-2 mb-4">
                <Receipt className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Factures ({factures.length})</h3>
              </div>
              {factures.length > 0 ? (
                <div className="space-y-2">
                  {factures.map((f) => (
                    <div key={f.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                      <div>
                        <div className="font-medium text-sm">{f.description || "Sans description"}</div>
                        <div className="text-xs text-muted-foreground">{formatDate(f.date)}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{formatCurrency(f.montant)}</span>
                        <Badge className={statutColors[f.statut]}>{statutLabels[f.statut]}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Aucune facture pour ce client</p>
              )}
            </div>

            {/* Reservations block */}
            {locationEnabled && (
              <div className="p-6 rounded-xl border border-border/50 bg-card">
                <div className="flex items-center gap-2 mb-4">
                  <CalendarCheck className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Réservations ({reservations.length})</h3>
                </div>
                {reservations.length > 0 ? (
                  <div className="space-y-2">
                    {reservations.map((r) => (
                      <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                        <div>
                          <div className="font-medium text-sm">{r.property_name}</div>
                          <div className="text-xs text-muted-foreground">{formatDate(r.date_arrivee)} → {formatDate(r.date_depart)}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{formatCurrency(r.montant_total)}</span>
                          <Badge className={statutColors[r.statut] || "bg-muted text-muted-foreground"}>{statutLabels[r.statut] || r.statut}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-muted-foreground text-sm">Aucune réservation pour ce client</p>}
              </div>
            )}

            {/* Transactions block */}
            {venteEnabled && (
              <div className="p-6 rounded-xl border border-border/50 bg-card">
                <div className="flex items-center gap-2 mb-4">
                  <Handshake className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Transactions ({transactions.length})</h3>
                </div>
                {transactions.length > 0 ? (
                  <div className="space-y-2">
                    {transactions.map((t) => (
                      <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                        <div>
                          <div className="font-medium text-sm">{t.property_name || "—"}</div>
                          <div className="text-xs text-muted-foreground">{formatDate(t.date_vente)}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{formatCurrency(t.montant_vente)}</span>
                          <Badge className={statutColors[t.statut] || "bg-muted text-muted-foreground"}>{t.statut}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-muted-foreground text-sm">Aucune transaction pour ce client</p>}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetail;
