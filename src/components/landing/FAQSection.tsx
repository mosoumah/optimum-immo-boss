import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { HelpCircle } from "lucide-react";

const faqs = [
  {
    q: "Comment fonctionne l'essai gratuit ?",
    a: "Dès votre inscription, votre agence bénéficie automatiquement d'un essai gratuit de 14 jours. Pendant cette période, vous avez accès à toutes les fonctionnalités d'Optimum Immo, sans engagement et sans renseigner de moyen de paiement. À la fin de l'essai, il vous suffit de choisir un abonnement afin de continuer à utiliser la plateforme.",
  },
  {
    q: "Dois-je renseigner une carte bancaire lors de l'inscription ?",
    a: "Non. Aucun moyen de paiement n'est demandé lors de votre inscription. Vous créez votre compte, vous testez la plateforme et vous décidez ensuite en toute liberté.",
  },
  {
    q: "Puis-je changer de forfait à tout moment ?",
    a: "Oui. Vous pouvez passer d'un forfait à un autre à tout moment selon la croissance et les besoins de votre agence. Le changement est immédiat et sans friction.",
  },
  {
    q: "Mes données sont-elles vraiment sécurisées ?",
    a: "Absolument. Chaque agence dispose de son propre espace totalement isolé. Les données sont protégées par une authentification sécurisée, un système de permissions avancées et une architecture garantissant qu'aucune agence ne peut accéder aux données d'une autre.",
  },
  {
    q: "Que se passe-t-il après les 14 jours d'essai ?",
    a: "Votre compte reste accessible et toutes vos données sont conservées. Pour continuer à utiliser les fonctionnalités de gestion, il suffit de choisir un abonnement adapté à votre agence.",
  },
  {
    q: "Quels moyens de paiement acceptez-vous ?",
    a: "Orange Money, MTN Mobile Money, Carte Visa, Mastercard et virement bancaire. Nous privilégions les moyens de paiement les plus utilisés en Guinée.",
  },
  {
    q: "Puis-je résilier mon abonnement ?",
    a: "Oui, à tout moment et sans justification. Vos données sont conservées pendant une période définie pour faciliter une éventuelle réactivation ultérieure.",
  },
  {
    q: "L'application fonctionne-t-elle sur mobile ?",
    a: "Oui. Optimum Immo est entièrement responsive et s'utilise avec la même fluidité sur ordinateur, tablette et smartphone.",
  },
];

function ToggleIcon({ open }: { open: boolean }) {
  return (
    <div className="relative w-10 h-10 shrink-0 rounded-full border border-primary/30 bg-primary/5 group-hover:bg-primary/15 group-hover:border-primary/60 transition-colors duration-300 flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 bg-[conic-gradient(from_0deg,transparent,hsl(var(--primary)/0.5),transparent_40%)] animate-[spin_4s_linear_infinite] transition-opacity duration-500" />
      <div className="relative w-4 h-4">
        {/* horizontal line (always present) */}
        <motion.span
          className="absolute top-1/2 left-0 right-0 h-[2px] bg-primary rounded-full -translate-y-1/2"
          animate={{ scaleX: 1 }}
        />
        {/* vertical line (rotates to hide when open) */}
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

export function FAQSection() {
  return (
    <section className="py-20 sm:py-28 border-t border-white/5 relative overflow-hidden">
      {/* ambient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,hsl(var(--primary)/0.08),transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(212,255,58,0.05)_1px,transparent_0)] [background-size:32px_32px] opacity-40 pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 mb-6">
            <HelpCircle className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-primary tracking-wide uppercase">
              Questions fréquentes
            </span>
          </div>
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl tracking-tight leading-[1.05]">
            Tout ce que vous vouliez{" "}
            <span className="italic text-primary">savoir</span>
          </h2>
          <p className="mt-5 text-base sm:text-lg text-muted-foreground">
            Les réponses claires aux questions que se posent les agences avant de
            se lancer avec Optimum Immo.
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
}
