import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Handshake, Plus, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DynamicSidebar } from "@/components/DynamicSidebar";
import { FloatingParticles } from "@/components/FloatingParticles";
import { useAuth } from "@/hooks/useAuth";
import { useEntreprise } from "@/hooks/useEntreprise";
import { supabase } from "@/integrations/supabase/client";
import { TransactionDialog } from "@/components/dialogs/TransactionDialog";

interface Transaction {
  id: string;
  montant_vente: number;
  commission: number;
  date_vente: string;
  statut: string;
  notes: string | null;
  clients?: { nom: string } | null;
  properties?: { nom: string } | null;
}

const statutColors: Record<string, string> = {
  en_cours: "bg-blue-500/20 text-blue-400",
  sous_compromis: "bg-warning/20 text-warning",
  finalisee: "bg-success/20 text-success",
  annulee: "bg-destructive/20 text-destructive",
};

const statutLabels: Record<string, string> = {
  en_cours: "En cours",
  sous_compromis: "Sous compromis",
  finalisee: "Finalisée",
  annulee: "Annulée",
};

const Transactions = () => {
  const { signOut } = useAuth();
  const { entrepriseId } = useEntreprise();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!entrepriseId) return;
    const { data } = await supabase
      .from("sales_transactions")
      .select("*, clients(nom), properties(nom)")
      .eq("entreprise_id", entrepriseId)
      .order("date_vente", { ascending: false });
    setTransactions((data as any[]) || []);
    setIsLoading(false);
  }, [entrepriseId]);

  useEffect(() => {
    if (entrepriseId) fetchTransactions();
  }, [entrepriseId, fetchTransactions]);

  const totalVentes = transactions.filter((t) => t.statut === "finalisee").reduce((s, t) => s + t.montant_vente, 0);
  const totalCommissions = transactions.filter((t) => t.statut === "finalisee").reduce((s, t) => s + t.commission, 0);
  const enCours = transactions.filter((t) => ["en_cours", "sous_compromis"].includes(t.statut)).length;
  const finalisees = transactions.filter((t) => t.statut === "finalisee").length;

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
              <h1 className="text-3xl font-bold">Transactions</h1>
              <p className="text-muted-foreground">Ventes immobilières</p>
            </div>
            <Button onClick={() => { setEditingTransaction(null); setDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />Nouvelle transaction
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Ventes totales", value: formatCurrency(totalVentes), Icon: TrendingUp },
              { label: "Commissions", value: formatCurrency(totalCommissions), Icon: Handshake },
              { label: "En cours", value: enCours, Icon: Clock },
              { label: "Finalisées", value: finalisees, Icon: CheckCircle },
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
          ) : transactions.length === 0 ? (
            <div className="text-center py-20">
              <Handshake className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Aucune transaction</h3>
              <p className="text-muted-foreground">Créez votre première transaction de vente</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border/50 overflow-hidden">
              <table className="w-full">
                <thead className="bg-secondary/30">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium">Client</th>
                    <th className="text-left p-3 text-sm font-medium">Bien</th>
                    <th className="text-left p-3 text-sm font-medium hidden md:table-cell">Date</th>
                    <th className="text-left p-3 text-sm font-medium hidden md:table-cell">Montant</th>
                    <th className="text-left p-3 text-sm font-medium hidden md:table-cell">Commission</th>
                    <th className="text-left p-3 text-sm font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr
                      key={t.id}
                      className="border-t border-border/30 hover:bg-secondary/20 cursor-pointer"
                      onClick={() => { setEditingTransaction(t); setDialogOpen(true); }}
                    >
                      <td className="p-3 text-sm">{(t as any).clients?.nom || "—"}</td>
                      <td className="p-3 text-sm">{(t as any).properties?.nom || "—"}</td>
                      <td className="p-3 text-sm hidden md:table-cell">{formatDate(t.date_vente)}</td>
                      <td className="p-3 text-sm hidden md:table-cell">{formatCurrency(t.montant_vente)}</td>
                      <td className="p-3 text-sm hidden md:table-cell">{formatCurrency(t.commission)}</td>
                      <td className="p-3"><Badge className={statutColors[t.statut]}>{statutLabels[t.statut] || t.statut}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <TransactionDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          transaction={editingTransaction}
          onSuccess={fetchTransactions}
        />
      </main>
    </div>
  );
};

export default Transactions;
