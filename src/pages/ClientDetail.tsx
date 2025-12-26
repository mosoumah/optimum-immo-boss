import { useEffect, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, ArrowLeft, FileText, Receipt, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useEntreprise } from "@/hooks/useEntreprise";

interface Client {
  id: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  created_at: string;
}

interface Devis {
  id: string;
  description: string | null;
  montant: number;
  statut: string;
  date: string;
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
};

const statutLabels: Record<string, string> = {
  brouillon: "Brouillon",
  envoye: "Envoyé",
  accepte: "Accepté",
  refuse: "Refusé",
  paye: "Payée",
  non_paye: "Non payée",
};

const ClientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { entrepriseId, isLoading: entrepriseLoading } = useEntreprise();
  const [client, setClient] = useState<Client | null>(null);
  const [devis, setDevis] = useState<Devis[]>([]);
  const [factures, setFactures] = useState<Facture[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchClientData = useCallback(async () => {
    if (!entrepriseId || !id) return;

    const [clientRes, devisRes, facturesRes] = await Promise.all([
      supabase
        .from("clients")
        .select("*")
        .eq("id", id)
        .eq("entreprise_id", entrepriseId)
        .maybeSingle(),
      supabase
        .from("devis")
        .select("id, description, montant, statut, date")
        .eq("client_id", id)
        .order("date", { ascending: false }),
      supabase
        .from("factures")
        .select("id, description, montant, statut, date")
        .eq("client_id", id)
        .order("date", { ascending: false }),
    ]);

    setClient(clientRes.data);
    setDevis(devisRes.data || []);
    setFactures(facturesRes.data || []);
    setIsLoading(false);
  }, [entrepriseId, id]);

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
      <div className="min-h-screen bg-background p-8">
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
    <div className="min-h-screen bg-background p-8">
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
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetail;
