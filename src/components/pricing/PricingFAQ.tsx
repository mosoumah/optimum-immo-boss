import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    q: "Comment fonctionne l'essai gratuit ?",
    a: "Dès votre inscription, votre agence bénéficie automatiquement d'un essai gratuit de 14 jours. Pendant cette période, vous avez accès à toutes les fonctionnalités d'Optimum Immo, sans engagement et sans renseigner de moyen de paiement. À la fin de l'essai, il vous suffit de choisir un abonnement afin de continuer à utiliser la plateforme.",
  },
  {
    q: "Dois-je renseigner une carte bancaire lors de l'inscription ?",
    a: "Non. Aucun moyen de paiement n'est demandé lors de votre inscription.",
  },
  {
    q: "Puis-je changer de forfait ?",
    a: "Oui. Vous pouvez changer de formule à tout moment selon les besoins de votre agence.",
  },
  {
    q: "Mes données sont-elles sécurisées ?",
    a: "Oui. Chaque agence dispose de son propre espace totalement isolé. Les données sont protégées par une authentification sécurisée, un système de permissions avancées et une architecture garantissant qu'aucune agence ne peut accéder aux données d'une autre.",
  },
  {
    q: "Que se passe-t-il après les 14 jours ?",
    a: "Votre compte reste accessible. Toutes vos données sont conservées. Pour continuer à utiliser les fonctionnalités de gestion, il vous suffit de choisir un abonnement.",
  },
  {
    q: "Quels moyens de paiement seront disponibles ?",
    a: "Orange Money, MTN Mobile Money, Carte Visa, Mastercard et Virement bancaire.",
  },
  {
    q: "Puis-je résilier mon abonnement ?",
    a: "Oui. Vous pouvez résilier votre abonnement à tout moment. Vos données seront conservées pendant une période définie afin de faciliter une réactivation ultérieure.",
  },
  {
    q: "L'application fonctionne-t-elle sur mobile ?",
    a: "Oui. Optimum Immo est entièrement responsive et fonctionne sur ordinateur, tablette et smartphone.",
  },
];

export const PricingFAQ = () => (
  <div className="max-w-3xl mx-auto">
    <div className="text-center mb-10">
      <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3">
        Questions fréquentes
      </h2>
      <p className="text-muted-foreground text-sm sm:text-base">
        Tout ce que vous devez savoir avant de commencer.
      </p>
    </div>
    <Accordion type="single" collapsible className="space-y-3">
      {faqs.map((f, i) => (
        <AccordionItem
          key={i}
          value={`item-${i}`}
          className="border border-border/40 rounded-2xl px-5 bg-card/40 backdrop-blur-sm data-[state=open]:border-primary/40 data-[state=open]:shadow-lg transition-all"
        >
          <AccordionTrigger className="text-left font-semibold text-sm sm:text-base hover:no-underline">
            {f.q}
          </AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
            {f.a}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  </div>
);
