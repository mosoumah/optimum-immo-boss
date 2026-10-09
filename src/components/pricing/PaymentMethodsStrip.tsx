import { CreditCard, Smartphone, Building2 } from "lucide-react";

const methods = [
  { label: "Orange Money", icon: Smartphone, color: "bg-orange-500/10 text-orange-500 border-orange-500/30" },
  { label: "MTN Mobile Money", icon: Smartphone, color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30" },
  { label: "Visa", icon: CreditCard, color: "bg-blue-500/10 text-blue-500 border-blue-500/30" },
  { label: "Mastercard", icon: CreditCard, color: "bg-red-500/10 text-red-500 border-red-500/30" },
  { label: "Virement bancaire", icon: Building2, color: "bg-primary/10 text-primary border-primary/30" },
];

export const PaymentMethodsStrip = () => (
  <div className="text-center">
    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-5 font-semibold">
      Moyens de paiement acceptés
    </p>
    <div className="flex flex-wrap justify-center gap-3">
      {methods.map((m) => (
        <div
          key={m.label}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border backdrop-blur-sm text-sm font-semibold ${m.color}`}
        >
          <m.icon className="w-4 h-4" />
          {m.label}
        </div>
      ))}
    </div>
  </div>
);
