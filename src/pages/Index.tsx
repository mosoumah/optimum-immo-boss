import { motion, useScroll } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import { PLANS, type BillingCycle, type Plan } from "@/lib/pricing/plans";
import { PlanCard } from "@/components/pricing/PlanCard";
import { BillingToggle } from "@/components/pricing/BillingToggle";
import {
  Users,
  Receipt,
  TrendingUp,
  CheckSquare,
  ArrowRight,
  ArrowUpRight,
  Building2,
  Shield,
  Zap,
  Clock,
  Wallet,
  Database,
  Trophy,
  CalendarRange,
  Sparkles,
  BarChart3,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ScrollStat } from "@/components/ScrollStat";
import dashboardPreview from "@/assets/dashboard-preview.png.asset.json";

const dashboardPreviewHostedUrl = `https://id-preview--02e776e0-6742-41b4-91f4-b05400405586.lovable.app${dashboardPreview.url}`;



const steps = [
  {
    n: "01",
    title: "Créez votre espace",
    desc: "Inscription en moins de 2 minutes. Importez vos clients, biens et historiques en quelques clics.",
  },
  {
    n: "02",
    title: "Pilotez en temps réel",
    desc: "Tableau de bord unifié : revenus, dépenses, réservations, tâches. Tout converge au même endroit.",
  },
  {
    n: "03",
    title: "Encaissez plus vite",
    desc: "Facturation automatisée, relances intelligentes, paiements suivis. Votre trésorerie respire.",
  },
];

const benefits = [
  { icon: Clock, title: "Gagnez du temps", desc: "Automatisez le répétitif, concentrez-vous sur le stratégique." },
  { icon: Wallet, title: "Économisez", desc: "Réduisez vos coûts opérationnels et augmentez vos marges." },
  { icon: Database, title: "Centralisez", desc: "Une seule source de vérité pour toutes vos données." },
  { icon: Trophy, title: "Distinguez-vous", desc: "Des outils dignes des plus grandes agences internationales." },
];

const Index = () => {
  const statsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const { scrollYProgress: statsScrollProgress } = useScroll({
    target: statsRef,
    offset: ["start end", "end start"],
  });

  const handlePlanSelect = (_plan: Plan) => {
    navigate("/tarifs");
  };

  return (

    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <Navbar />

      {/* ============== HERO ============== */}
      <section className="relative pt-28 sm:pt-32 pb-10 sm:pb-16 overflow-hidden">
        {/* Ambient lighting */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] max-w-[120vw] h-[700px] bg-primary/10 blur-[140px] rounded-full" />
          <div className="absolute top-40 right-0 w-[400px] h-[400px] bg-primary/5 blur-[120px] rounded-full" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(212,255,58,0.06)_1px,transparent_0)] [background-size:48px_48px] opacity-50" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 relative">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="group relative inline-flex flex-col sm:flex-row items-center gap-3 sm:gap-4 px-5 sm:px-6 py-3 sm:py-3.5 rounded-full border border-primary/40 bg-gradient-to-r from-primary/15 via-primary/5 to-primary/15 backdrop-blur-xl shadow-[0_0_40px_hsl(var(--primary)/0.15)] overflow-hidden"
            >
              <span className="pointer-events-none absolute inset-0 rounded-full bg-[linear-gradient(110deg,transparent_25%,hsl(var(--primary)/0.25)_50%,transparent_75%)] bg-[length:200%_100%] animate-shimmer" />
              <span className="relative flex items-center gap-2">
                <span className="text-lg sm:text-xl leading-none">🎉</span>
                <span className="text-[11px] sm:text-xs font-bold text-primary tracking-[0.14em] uppercase whitespace-nowrap">
                  14 jours d'essai gratuits
                </span>
              </span>
              <span className="relative hidden sm:block h-4 w-px bg-primary/30" />
              <span className="relative text-[11px] sm:text-xs font-medium text-foreground/80 tracking-wide">
                Aucune carte bancaire requise · Toutes les fonctionnalités incluses
              </span>
            </motion.div>


            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8 font-display text-[3rem] leading-[0.95] sm:text-7xl md:text-[5.5rem] lg:text-[6.5rem] tracking-tight"
            >
              L'excellence{" "}
              <span className="italic text-primary [text-shadow:0_0_60px_hsl(var(--primary)/0.4)]">
                immobilière
              </span>
              <br className="hidden sm:block" />
              <span className="text-foreground/90">orchestrée.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="mt-7 sm:mt-8 max-w-2xl mx-auto text-base sm:text-lg text-muted-foreground leading-relaxed px-2"
            >
              Optimum Immo réunit clients, biens, factures et réservations dans une expérience
              unique. Pensée pour les agences guinéennes ambitieuses.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3"
            >
              <Link
                to="/inscription"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-7 py-3.5 font-medium shadow-[0_0_0_1px_hsl(var(--primary)),0_10px_40px_-10px_hsl(var(--primary)/0.6)] hover:shadow-[0_0_0_1px_hsl(var(--primary)),0_20px_60px_-10px_hsl(var(--primary)/0.8)] transition-all duration-300"
              >
                14 jours d'essai gratuits
                <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.02] text-foreground px-7 py-3.5 font-medium hover:bg-white/[0.05] hover:border-white/20 transition-all"
              >
                Découvrir la plateforme
              </a>
            </motion.div>
          </div>

          {/* Dashboard mockup */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="dashboard-preview-motion mt-10 sm:mt-14 mx-auto max-w-6xl relative"
          >
            <div className="absolute -inset-8 bg-primary/15 blur-[100px] rounded-[3rem] -z-10" />
            <div className="dashboard-preview-animated relative rounded-2xl overflow-hidden border border-white/10 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.8)] bg-card/40 backdrop-blur">
              <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
              <img
                src={dashboardPreview.url}
                alt="Aperçu du tableau de bord Optimum Immo"
                className="dashboard-preview-image w-full h-auto block"
                loading="eager"
                fetchPriority="high"
                onError={(event) => {
                  const image = event.currentTarget;

                  if (image.src !== dashboardPreviewHostedUrl) {
                    image.src = dashboardPreviewHostedUrl;
                  }
                }}
              />
            </div>
            {/* Floating chips */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              className="hidden md:flex absolute -left-6 top-1/3 items-center gap-2.5 rounded-2xl bg-card/90 backdrop-blur-xl border border-white/10 px-4 py-3 shadow-2xl"
            >
              <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              <div className="text-left">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Revenus</div>
                <div className="text-sm font-semibold">+24% ce mois</div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4, duration: 0.6 }}
              className="hidden md:flex absolute -right-6 bottom-1/4 items-center gap-2.5 rounded-2xl bg-card/90 backdrop-blur-xl border border-white/10 px-4 py-3 shadow-2xl"
            >
              <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div className="text-left">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">IA active</div>
                <div className="text-sm font-semibold">Relances auto</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ============== STATS BAND ============== */}
      <section ref={statsRef} className="relative py-10 border-y border-white/5">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-10">
            <ScrollStat
              scrollProgress={statsScrollProgress}
              prefix="+"
              values={[150, 150, 150, 150]}
              label="Agences accompagnées"
              index={0}
            />
            <ScrollStat
              scrollProgress={statsScrollProgress}
              values={[1456, 1456, 1456, 1456]}
              formatNumber={(n) =>
                Math.round(n)
                  .toLocaleString("fr-FR")
                  .replace(/\s/g, " ")
                  .replace(/,/g, " ")
              }
              label="Biens gérés"
              index={1}
            />
            <ScrollStat
              scrollProgress={statsScrollProgress}
              values={[32, 65, 120, 32]}
              suffix=" K"
              label="Factures émises"
              index={2}
            />
            <ScrollStat
              scrollProgress={statsScrollProgress}
              values={[99.9, 99.99, 99.999, 99.9]}
              suffix="%"
              decimals={1}
              label="Disponibilité"
              index={3}
            />
          </div>
        </div>
      </section>


      {/* ============== BENTO FEATURES ============== */}
      <section id="features" className="py-12 sm:py-20 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="container mx-auto px-4 sm:px-6 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mb-10"
          >
            <div className="text-xs uppercase tracking-[0.2em] text-primary mb-4">— Fonctionnalités</div>
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl tracking-tight leading-[1.05]">
              Une suite{" "}
              <span className="italic text-primary">complète</span>, pensée comme un seul geste.
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 sm:gap-5 auto-rows-[minmax(180px,auto)]">
            {/* Big: Dashboard */}
            <BentoCard className="md:col-span-4 md:row-span-2 min-h-[360px]" index={0}>
              <div className="flex flex-col h-full">
                <div className="flex items-start justify-between">
                  <div className="w-11 h-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Temps réel</span>
                </div>
                <div className="mt-auto">
                  <h3 className="font-display text-3xl sm:text-4xl tracking-tight">
                    Tableau de bord <span className="italic text-primary">unifié</span>
                  </h3>
                  <p className="mt-3 text-sm text-muted-foreground max-w-md leading-relaxed">
                    Revenus, dépenses, taux d'occupation, alertes. Une vue d'ensemble qui se met à jour
                    en temps réel — chaque décision repose sur des chiffres frais.
                  </p>
                </div>
                {/* Decorative mini chart */}
                <svg className="absolute right-6 bottom-6 opacity-60" width="200" height="80" viewBox="0 0 200 80" fill="none">
                  <path d="M0 60 L30 50 L60 55 L90 30 L120 35 L150 15 L180 25 L200 10" stroke="hsl(var(--primary))" strokeWidth="2" fill="none" />
                  <path d="M0 60 L30 50 L60 55 L90 30 L120 35 L150 15 L180 25 L200 10 L200 80 L0 80 Z" fill="url(#g1)" opacity="0.3" />
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </BentoCard>

            <BentoCard className="md:col-span-2" index={1}>
              <Icon icon={Users} />
              <h3 className="mt-5 font-display text-2xl">Clients centralisés</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Historique complet, contacts, transactions — chaque client a son dossier vivant.
              </p>
            </BentoCard>

            <BentoCard className="md:col-span-2" index={2}>
              <Icon icon={Receipt} />
              <h3 className="mt-5 font-display text-2xl">Facturation fluide</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Génération automatique, signature, suivi des paiements en un coup d'œil.
              </p>
            </BentoCard>

            <BentoCard className="md:col-span-3" index={3}>
              <Icon icon={Building2} />
              <h3 className="mt-5 font-display text-2xl">Biens & galeries</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Fiches détaillées, photos haute résolution, documents PDF, statuts synchronisés
                avec les réservations.
              </p>
            </BentoCard>

            <BentoCard className="md:col-span-3" index={4}>
              <Icon icon={CalendarRange} />
              <h3 className="mt-5 font-display text-2xl">Réservations intelligentes</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Calendrier, calcul automatique du reste à payer, factures générées à la volée.
              </p>
            </BentoCard>

            <BentoCard className="md:col-span-2" index={5}>
              <Icon icon={CheckSquare} />
              <h3 className="mt-5 font-display text-2xl">Tâches & équipe</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Assignez, suivez, échangez — la messagerie est intégrée.
              </p>
            </BentoCard>

            <BentoCard className="md:col-span-4" index={6}>
              <div className="flex items-start gap-5">
                <Icon icon={Sparkles} />
                <div>
                  <h3 className="font-display text-2xl">
                    Assistant <span className="italic text-primary">IA</span> intégré
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-lg">
                    ImmoPilot répond, analyse, rédige et suggère. Votre copilote stratégique,
                    branché à toutes vos données — en français, 24/7.
                  </p>
                </div>
              </div>
            </BentoCard>
          </div>
        </div>
      </section>

      {/* ============== HOW IT WORKS ============== */}
      <section id="how" className="py-12 sm:py-20 border-t border-white/5">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-12 gap-10 md:gap-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="md:col-span-4 md:sticky md:top-32 self-start"
            >
              <div className="text-xs uppercase tracking-[0.2em] text-primary mb-4">— Processus</div>
              <h2 className="font-display text-4xl sm:text-5xl tracking-tight leading-[1.05]">
                Trois étapes,<br />
                <span className="italic text-primary">zéro friction</span>.
              </h2>
              <p className="mt-5 text-sm text-muted-foreground max-w-xs leading-relaxed">
                De l'inscription à la première facture encaissée, la plateforme vous tient la main.
              </p>
            </motion.div>

            <div className="md:col-span-8 relative">
              <div className="absolute left-6 top-3 bottom-3 w-px bg-gradient-to-b from-primary/40 via-primary/20 to-transparent md:block hidden" />
              <div className="space-y-10">
                {steps.map((s, i) => (
                  <motion.div
                    key={s.n}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className="relative md:pl-20"
                  >
                    <div className="md:absolute md:left-0 md:top-1 flex items-center justify-center w-12 h-12 rounded-2xl bg-card border border-primary/30 mb-4 md:mb-0">
                      <span className="font-display text-lg text-primary">{s.n}</span>
                    </div>
                    <h3 className="font-display text-2xl sm:text-3xl tracking-tight">{s.title}</h3>
                    <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl">
                      {s.desc}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============== BENEFITS ============== */}
      <section id="benefits" className="py-12 sm:py-20 border-t border-white/5">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-10"
          >
            <div className="text-xs uppercase tracking-[0.2em] text-primary mb-4">— Avantages</div>
            <h2 className="font-display text-4xl sm:text-5xl tracking-tight leading-[1.05]">
              Pourquoi les agences{" "}
              <span className="italic text-primary">choisissent</span> Optimum.
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {benefits.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="group relative rounded-2xl border border-white/10 bg-card/30 backdrop-blur-sm p-7 hover:border-primary/40 hover:bg-card/50 transition-all duration-500"
              >
                <div className="w-11 h-11 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-center mb-5 group-hover:bg-primary/15 transition-colors">
                  <b.icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="font-display text-2xl tracking-tight">{b.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============== PRICING ============== */}
      <section id="pricing" className="py-10 sm:py-14 border-t border-white/5 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-primary/5 blur-[140px] rounded-full pointer-events-none" />
        <div className="container mx-auto px-4 sm:px-6 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-10"
          >
            <div className="text-xs uppercase tracking-[0.2em] text-primary mb-4">— Tarifs</div>
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl tracking-tight leading-[1.05]">
              Un forfait adapté à{" "}
              <span className="italic text-primary">votre agence</span>.
            </h2>
            <p className="mt-5 text-sm sm:text-base text-muted-foreground">
              14 jours d'essai gratuits. Sans carte bancaire. Sans engagement.
            </p>
            <div className="mt-8 flex justify-center">
              <BillingToggle value={billingCycle} onChange={setBillingCycle} />
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 max-w-6xl mx-auto items-stretch">
            {PLANS.map((plan, i) => (
              <PlanCard key={plan.id} plan={plan} cycle={billingCycle} onSelect={handlePlanSelect} index={i} />
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              to="/tarifs"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium"
            >
              Voir tous les détails et la FAQ
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>



      {/* ============== TESTIMONIAL ============== */}
      <section className="py-10 sm:py-14 border-t border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.08),transparent_60%)] pointer-events-none" />
        <div className="container mx-auto px-6 relative">
          <motion.blockquote
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center"
          >
            <div className="font-display text-5xl text-primary leading-none mb-6">"</div>
            <p className="font-display italic text-3xl sm:text-4xl md:text-5xl tracking-tight leading-[1.15] text-foreground/95">
              Avant Optimum, je passais mes soirées sur Excel. Aujourd'hui, je gère trois fois
              plus de biens, avec deux fois moins de stress.
            </p>
            <footer className="mt-10 text-sm text-muted-foreground">
              <span className="text-foreground font-medium">Mariama Bah</span> — Directrice, Conakry Estates
            </footer>
          </motion.blockquote>
        </div>
      </section>

      {/* ============== FINAL CTA ============== */}
      <section className="py-12 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative rounded-[2rem] overflow-hidden border border-primary/30 bg-gradient-to-br from-card via-card/80 to-background"
          >
            <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(212,255,58,0.08)_1px,transparent_0)] [background-size:32px_32px] opacity-50" />

            <div className="relative px-6 sm:px-12 md:px-20 py-12 sm:py-16 text-center">
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                whileInView={{ scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 180, damping: 14 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl border border-primary/30 bg-primary/10 mb-8"
              >
                <Building2 className="w-7 h-7 text-primary" />
              </motion.div>

              <h2 className="font-display text-4xl sm:text-5xl md:text-6xl tracking-tight leading-[1.05] max-w-3xl mx-auto">
                Prêt à transformer{" "}
                <span className="italic text-primary">votre agence</span> ?
              </h2>
              <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
                Rejoignez les agences qui ont choisi de travailler avec rigueur, sérénité et style.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
                <Link
                  to="/inscription"
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-8 py-4 font-medium shadow-[0_10px_40px_-10px_hsl(var(--primary)/0.6)] hover:shadow-[0_20px_60px_-10px_hsl(var(--primary)/0.9)] transition-all"
                >
                  Créer mon compte
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/connexion"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-8 py-4 font-medium hover:bg-white/[0.05] hover:border-white/20 transition-all"
                >
                  J'ai déjà un compte
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-2"><Shield className="w-3.5 h-3.5 text-primary" /> Données sécurisées</span>
                <span className="inline-flex items-center gap-2"><Zap className="w-3.5 h-3.5 text-primary" /> Mise en route immédiate</span>
                <span className="inline-flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-primary" /> IA incluse</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

/* ----- Helpers ----- */

const Icon = ({ icon: I }: { icon: typeof Users }) => (
  <div className="inline-flex w-11 h-11 rounded-2xl bg-primary/10 border border-primary/20 items-center justify-center">
    <I className="w-5 h-5 text-primary" strokeWidth={1.5} />
  </div>
);

const BentoCard = ({
  children,
  className = "",
  index = 0,
}: {
  children: React.ReactNode;
  className?: string;
  index?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.55, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
    className={`group relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-card/60 to-card/20 backdrop-blur-sm p-6 sm:p-8 hover:border-primary/30 transition-all duration-500 ${className}`}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    <div className="relative h-full">{children}</div>
  </motion.div>
);

export default Index;
