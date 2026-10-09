import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";

const testimonials = [
  {
    name: "Mariama Bah",
    role: "Directrice, Conakry Estates",
    initials: "MB",
    quote:
      "Avant Optimum, je passais mes soirées sur Excel. Aujourd'hui, je gère trois fois plus de biens, avec deux fois moins de stress.",
    accent: "from-primary/30 to-primary/5",
  },
  {
    name: "Ibrahima Diallo",
    role: "Gérant, Kaloum Immobilier",
    initials: "ID",
    quote:
      "Les factures et reçus se génèrent en un clic. Mes clients reçoivent des documents dignes d'une grande agence.",
    accent: "from-emerald-400/30 to-primary/5",
  },
  {
    name: "Fatoumata Camara",
    role: "Fondatrice, FC Habitat",
    initials: "FC",
    quote:
      "Le tableau de bord me montre exactement où va l'argent. Je prends enfin des décisions basées sur des chiffres fiables.",
    accent: "from-primary/25 to-emerald-500/10",
  },
  {
    name: "Ousmane Sylla",
    role: "Directeur, Ratoma Properties",
    initials: "OS",
    quote:
      "L'équipe entière travaille sur la même plateforme. Fini les fichiers dispersés et les infos perdues.",
    accent: "from-lime-400/30 to-primary/5",
  },
  {
    name: "Aïssata Barry",
    role: "Responsable location, Kipé Résidences",
    initials: "AB",
    quote:
      "Les réservations, les paiements, les alertes de départ — tout est automatisé. Je gagne au moins 10h par semaine.",
    accent: "from-primary/30 to-yellow-400/10",
  },
  {
    name: "Mamadou Touré",
    role: "Agent principal, MT Immobilier",
    initials: "MT",
    quote:
      "Interface claire, réactive, moderne. Mes collaborateurs l'ont adoptée en une matinée, sans formation.",
    accent: "from-emerald-400/25 to-primary/10",
  },
];

const row1 = testimonials.slice(0, 3);
const row2 = testimonials.slice(3);

function Card({ t, index }: { t: (typeof testimonials)[number]; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
      className="group relative w-[280px] sm:w-[340px] md:w-[380px] shrink-0 rounded-3xl p-[1px] overflow-hidden"
    >
      {/* animated gradient border */}
      <div
        className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${t.accent} opacity-60 group-hover:opacity-100 transition-opacity duration-500`}
      />
      <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-[conic-gradient(from_0deg,transparent,hsl(var(--primary)/0.5),transparent_30%)] animate-[spin_6s_linear_infinite]" />

      <div className="relative h-full rounded-3xl bg-card/80 backdrop-blur-xl border border-white/5 p-7 flex flex-col">
        {/* glow blob */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-primary/10 blur-3xl rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

        <div className="flex items-center justify-between mb-5 relative">
          <div className="w-11 h-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Quote className="w-5 h-5 text-primary" />
          </div>
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-primary text-primary" />
            ))}
          </div>
        </div>

        <p className="relative text-[15px] leading-relaxed text-foreground/90 flex-1">
          "{t.quote}"
        </p>

        <div className="relative mt-6 pt-5 border-t border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20">
            {t.initials}
          </div>
          <div>
            <div className="text-sm font-medium text-foreground">{t.name}</div>
            <div className="text-xs text-muted-foreground">{t.role}</div>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function MarqueeRow({
  items,
  reverse = false,
  duration = 40,
}: {
  items: typeof testimonials;
  reverse?: boolean;
  duration?: number;
}) {
  const loop = [...items, ...items];
  return (
    <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
      <motion.div
        className="flex gap-6 w-max"
        animate={{ x: reverse ? ["-50%", "0%"] : ["0%", "-50%"] }}
        transition={{ duration, repeat: Infinity, ease: "linear" }}
      >
        {loop.map((t, i) => (
          <Card key={`${t.name}-${i}`} t={t} index={i % items.length} />
        ))}
      </motion.div>
    </div>
  );
}

export function TestimonialsSection() {
  return (
    <section className="py-12 sm:py-16 border-t border-white/5 relative overflow-hidden">
      {/* ambient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.1),transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(212,255,58,0.06)_1px,transparent_0)] [background-size:32px_32px] opacity-40 pointer-events-none" />

      <div className="container mx-auto px-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-medium text-primary tracking-wide uppercase">
              Ils nous font confiance
            </span>
          </div>
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl tracking-tight leading-[1.05]">
            Des agences qui parlent{" "}
            <span className="italic text-primary">d'Optimum</span>
          </h2>
          <p className="mt-5 text-base sm:text-lg text-muted-foreground">
            Directeurs, gérants et agents partagent leur expérience — dans leurs mots,
            avec leurs chiffres.
          </p>
        </motion.div>

        <div className="space-y-6">
          <MarqueeRow items={row1} duration={45} />
          <MarqueeRow items={row2} reverse duration={50} />
        </div>
      </div>
    </section>
  );
}
