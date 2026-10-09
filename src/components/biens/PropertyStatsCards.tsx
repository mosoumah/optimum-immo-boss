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
    <div className="grid w-full min-w-0 grid-cols-2 lg:grid-cols-4 gap-3 overflow-hidden">
      {items.map((it) => (
        <div key={it.label} className="min-w-0 overflow-hidden rounded-xl border border-border/50 bg-card p-3 sm:p-4">
          <div className="flex min-w-0 items-center gap-1.5 mb-1.5">
            <it.icon className={`w-3.5 h-3.5 flex-none ${it.color}`} />
            <span className="min-w-0 text-[11px] sm:text-xs text-muted-foreground leading-tight break-words">{it.label}</span>
          </div>
          <div className="text-sm sm:text-base font-semibold break-words leading-tight">{it.value}</div>
        </div>
      ))}
    </div>
  );
};
