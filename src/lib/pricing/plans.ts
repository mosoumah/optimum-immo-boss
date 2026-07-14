export type PlanId = "starter" | "standard" | "pro";
export type BillingCycle = "monthly" | "yearly";

export interface Plan {
  id: PlanId;
  name: string;
  accent: string; // tailwind color class hint
  emoji: string;
  popular?: boolean;
  tagline: string;
  priceMonthly: number; // GNF
  priceYearly: number; // GNF total per year
  savingsYearly: number; // GNF
  features: string[];
  cta: string;
}

const gnf = (n: number) => n.toLocaleString("fr-FR").replace(/\s/g, " ") + " GNF";

export const formatGNF = gnf;

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    accent: "emerald",
    emoji: "🟢",
    tagline: "Pour démarrer sereinement",
    priceMonthly: 149000,
    priceYearly: 1490000,
    savingsYearly: 298000,
    cta: "Commencer",
    features: [
      "Clients illimités",
      "Biens illimités",
      "Réservations illimitées",
      "100 factures par mois",
      "Revenus & Dépenses",
      "Tableau de bord Standard",
      "Notifications",
      "2 utilisateurs",
      "Support Email",
    ],
  },
  {
    id: "standard",
    name: "Standard",
    accent: "primary",
    emoji: "🔵",
    popular: true,
    tagline: "Le plus choisi par les agences",
    priceMonthly: 349000,
    priceYearly: 3490000,
    savingsYearly: 698000,
    cta: "Choisir Standard",
    features: [
      "Toutes les fonctionnalités Starter",
      "500 factures par mois",
      "Assistant IA",
      "Jusqu'à 5 utilisateurs",
      "Gestion des permissions",
      "Tableau de bord Avancé",
      "Support prioritaire",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    accent: "violet",
    emoji: "🟣",
    tagline: "Pour les agences ambitieuses",
    priceMonthly: 699000,
    priceYearly: 6990000,
    savingsYearly: 1398000,
    cta: "Choisir Pro",
    features: [
      "Toutes les fonctionnalités Standard",
      "Factures illimitées",
      "Utilisateurs illimités",
      "Assistant IA avancé",
      "Messagerie interne",
      "Tableau de bord Premium",
      "Support Premium dédié",
    ],
  },
];
