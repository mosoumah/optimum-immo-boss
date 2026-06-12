import { Wallet, CalendarCheck, Percent, Clock } from "lucide-react";

interface PropertyStatsCardsProps {
  revenue: number;
  total: number;
  occupancyRate: number;
  lastReservationLabel: string;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("fr-GN", { style: "decimal", minimumFractionDigits: 0 }).format(amount) + " GNF";

export const PropertyStatsCards = ({ revenue, total, occupancyRate, lastReservationLabel }: PropertyStatsCardsProps) => {
  const items = [
    { icon: Wallet, label: "Revenus générés", value: formatCurrency(revenue), color: "text-success" },
    { icon: CalendarCheck, label: "Réservations", value: total.toString(), color: "text-primary" },
    { icon: Percent, label: "Taux d'occupation", value: `${occupancyRate}%`, color: "text-warning" },
    { icon: Clock, label: "Dernière réservation", value: lastReservationLabel, color: "text-foreground" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((it) => (
        <div key={it.label} className="p-4 rounded-xl border border-border/50 bg-card">
          <div className="flex items-center gap-2 mb-2">
            <it.icon className={`w-4 h-4 ${it.color}`} />
            <span className="text-xs text-muted-foreground">{it.label}</span>
          </div>
          <div className="text-base font-semibold truncate">{it.value}</div>
        </div>
      ))}
    </div>
  );
};
