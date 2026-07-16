import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Sparkles } from "lucide-react";

const faqs = [
  {
    q: "Que comprend exactement l'essai gratuit de 14 jours ?",
    a: "Dès votre inscription, votre agence débloque un accès complet à Optimum Immo pendant 14 jours : gestion des biens, clients, réservations, factures, revenus, dépenses, tableau de bord avancé et assistant IA. Aucune fonctionnalité n'est bridée. À la fin de la période, vous choisissez sereinement le forfait qui correspond à votre activité, sans aucune interruption de vos données.",
  },
  {
    q: "Quelle est la différence concrète entre Starter, Standard et Pro ?",
    a: "Starter est pensé pour les agences qui se lancent et gèrent l'essentiel (clients, biens, réservations, jusqu'à 100 factures/mois, 2 utilisateurs). Standard ajoute l'assistant IA, la gestion fine des permissions, le tableau de bord avancé et jusqu'à 5 utilisateurs (500 factures/mois). Pro débride tout : factures illimitées, utilisateurs illimités, messagerie interne, IA avancée et support premium dédié.",
  },
  {
    q: "Le paiement annuel est-il réellement avantageux ?",
    a: "Oui. En choisissant la facturation annuelle, vous économisez l'équivalent de 2 mois d'abonnement sur chacun des forfaits, soit jusqu'à 1 398 000 GNF d'économies par an sur le forfait Pro. Le tarif reste bloqué toute l'année, quelle que soit l'évolution de nos prix publics.",
  },
  {
    q: "Puis-je changer de forfait à tout moment ?",
    a: "Absolument. Vous pouvez monter en gamme dès qu'une nouvelle fonctionnalité vous devient utile, ou revenir à un forfait plus léger si vos besoins évoluent. Le changement est immédiat, sans frais cachés et sans perte de données. Vous ne payez que la différence au prorata.",
  },
  {
    q: "Comment se déroule concrètement le paiement en Guinée ?",
    a: "Nous acceptons Orange Money, MTN Mobile Money, Carte Visa, Mastercard et virement bancaire local. Après avoir sélectionné votre forfait, notre équipe vous contacte sous 24h pour finaliser l'activation via le moyen de paiement de votre choix. Aucune carte n'est requise pour démarrer l'essai.",
  },
  {
    q: "Mes données sont-elles réellement isolées des autres agences ?",
    a: "Oui. L'architecture d'Optimum Immo repose sur un cloisonnement strict par agence : chaque entreprise possède son propre espace protégé au niveau de la base de données. Aucune requête, aucune API et aucun utilisateur ne peut accéder aux données d'une autre agence. Nous appliquons également un système de permissions granulaire pour maîtriser les accès en interne.",
  },
  {
    q: "Que devient mon compte si je ne prends pas d'abonnement ?",
    a: "Vos données restent intégralement conservées. Votre espace passe simplement en lecture limitée, le temps que vous décidiez. Dès que vous choisissez un forfait, tout est immédiatement réactivé — biens, clients, historique, factures et paramètres — exactement comme vous les aviez laissés.",
  },
  {
    q: "Puis-je résilier mon abonnement quand je veux ?",
    a: "Oui, sans engagement et sans justification. La résiliation se fait en un clic depuis vos paramètres. Vos données sont conservées pendant une période définie afin de faciliter une éventuelle reprise, et un export complet est disponible à tout moment.",
  },
  {
    q: "Proposez-vous un accompagnement pour démarrer ?",
    a: "Oui. Chaque nouvelle agence bénéficie d'un accompagnement au lancement : prise en main guidée, import de vos biens et clients existants, et réponses rapides de notre support. Les forfaits Standard et Pro incluent en plus un support prioritaire, avec un interlocuteur dédié pour le forfait Pro.",
  },
];

function ToggleIcon({ open }: { open: boolean }) {
  return (
    <div className="relative w-10 h-10 shrink-0 rounded-full border border-primary/30 bg-primary/5 group-hover:bg-primary/15 group-hover:border-primary/60 transition-colors duration-300 flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 bg-[conic-gradient(from_0deg,transparent,hsl(var(--primary)/0.5),transparent_40%)] animate-[spin_4s_linear_infinite] transition-opacity duration-500" />
      <div className="relative w-4 h-4">
        <motion.span
          className="absolute top-1/2 left-0 right-0 h-[2px] bg-primary rounded-full -translate-y-1/2"
          animate={{ scaleX: 1 }}
        />
        <motion.span
          className="absolute top-0 bottom-0 left-1/2 w-[2px] bg-primary rounded-full -translate-x-1/2"
          animate={{ rotate: open ? 90 : 0, opacity: open ? 0 : 1 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

function FAQItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className="group relative rounded-2xl p-[1px] overflow-hidden"
    >
      <div
        className={`absolute inset-0 rounded-2xl bg-gradient-to-br transition-opacity duration-500 ${
          open
            ? "from-primary/50 via-primary/20 to-emerald-400/30 opacity-100"
            : "from-white/10 to-white/5 opacity-100 group-hover:from-primary/30 group-hover:to-emerald-400/20"
        }`}
      />
      <div className="relative rounded-2xl bg-card/80 backdrop-blur-xl">
        {open && (
          <div className="absolute -top-16 -right-10 w-40 h-40 bg-primary/15 blur-3xl rounded-full pointer-events-none" />
        )}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="relative w-full flex items-center gap-5 text-left px-5 sm:px-7 py-5 sm:py-6"
        >
          <span className="hidden sm:flex text-xs font-mono text-primary/70 tabular-nums w-8">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="flex-1 font-display text-lg sm:text-xl leading-snug text-foreground">
            {q}
          </span>
          <ToggleIcon open={open} />
        </button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="px-5 sm:px-7 pb-6 sm:pb-7 pl-5 sm:pl-20 pr-16 sm:pr-24">
                <div className="h-px w-full bg-gradient-to-r from-primary/40 via-primary/10 to-transparent mb-4" />
                <p className="text-[15px] sm:text-base leading-relaxed text-muted-foreground">
                  {a}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export const PricingFAQ = () => {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[720px] h-[720px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-primary tracking-wide uppercase">
              Tout savoir sur nos forfaits
            </span>
          </div>
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl tracking-tight leading-[1.05]">
            Les réponses aux questions{" "}
            <span className="italic text-primary">qui comptent</span>
          </h2>
          <p className="mt-5 text-base sm:text-lg text-muted-foreground">
            Prix, sécurité, paiement mobile, résiliation, accompagnement — tout ce que
            les agences immobilières nous demandent avant de choisir leur forfait.
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((f, i) => (
            <FAQItem key={i} q={f.q} a={f.a} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};
