import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { useRef } from "react";
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
  const heroRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const { scrollYProgress: statsScrollProgress } = useScroll({
    target: statsRef,
    offset: ["start end", "end start"],
  });
  const mockupY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const mockupRotate = useTransform(scrollYProgress, [0, 1], [-2, 2]);

  return (

    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <Navbar />

      {/* ============== HERO ============== */}
      <section ref={heroRef} className="relative pt-32 sm:pt-40 pb-20 sm:pb-32 overflow-hidden">
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
              className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 backdrop-blur-sm"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
              </span>
              <span className="text-[11px] sm:text-xs font-medium text-primary tracking-[0.12em] uppercase">
                Plateforme immobilière premium
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
                Démarrer gratuitement
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

          {/* Dashboard mockup — fully rendered, animated */}
          <motion.div
            style={{ y: mockupY, rotate: mockupRotate }}
            initial={{ opacity: 0, y: 60, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mt-16 sm:mt-24 mx-auto max-w-6xl relative"
          >
            {/* Ambient glow */}
            <div className="absolute -inset-10 bg-primary/20 blur-[120px] rounded-[3rem] -z-10" />
            <div className="absolute -inset-2 bg-gradient-to-tr from-primary/10 via-transparent to-primary/10 blur-2xl rounded-[2rem] -z-10" />

            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.85)] bg-gradient-to-br from-[#0d0f0a] via-[#0a0b08] to-[#0d0f0a]">
              {/* Top sheen */}
              <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />

              {/* Window chrome */}
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/5 bg-white/[0.015]">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-primary/70" />
                <div className="ml-4 h-5 flex-1 max-w-xs rounded-md bg-white/[0.03] border border-white/5 flex items-center px-2.5">
                  <span className="text-[10px] text-muted-foreground/70 font-mono">optimum-immo.app/dashboard</span>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-4 p-5 sm:p-6">
                {/* Sidebar */}
                <div className="hidden md:flex col-span-2 flex-col gap-2">
                  <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="w-6 h-6 rounded-md bg-primary/30" />
                    <div className="h-2 flex-1 rounded bg-primary/60" />
                  </div>
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-white/[0.02]">
                      <div className="w-6 h-6 rounded-md bg-white/5" />
                      <div className="h-2 flex-1 rounded bg-white/10" style={{ width: `${60 + i * 6}%` }} />
                    </div>
                  ))}
                </div>

                {/* Main content */}
                <div className="col-span-12 md:col-span-10 space-y-4">
                  {/* KPI row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Revenus", value: "48,2M", delta: "+24%", icon: TrendingUp },
                      { label: "Réservations", value: "127", delta: "+8", icon: CalendarRange },
                      { label: "Factures", value: "312", delta: "+42", icon: Receipt },
                      { label: "Clients", value: "1 240", delta: "+18", icon: Users },
                    ].map((k, i) => (
                      <motion.div
                        key={k.label}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 + i * 0.08, duration: 0.5 }}
                        className="rounded-xl border border-white/5 bg-white/[0.02] p-3"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[9px] uppercase tracking-wider text-muted-foreground/80">{k.label}</span>
                          <k.icon className="w-3 h-3 text-primary" />
                        </div>
                        <div className="text-lg font-bold tracking-tight" style={{ fontFamily: '"Instrument Serif", serif' }}>
                          {k.value}
                        </div>
                        <div className="text-[10px] text-primary font-medium mt-0.5">{k.delta}</div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Chart + side panel */}
                  <div className="grid grid-cols-3 gap-4">
                    {/* Chart */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.1, duration: 0.6 }}
                      className="col-span-3 lg:col-span-2 rounded-xl border border-white/5 bg-white/[0.02] p-4 h-56 relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="text-xs text-muted-foreground/80">Revenus mensuels</div>
                          <div className="text-sm font-semibold">GNF 48 200 000</div>
                        </div>
                        <div className="flex gap-1">
                          {["1M", "3M", "1A"].map((t, i) => (
                            <span key={t} className={`text-[9px] px-1.5 py-0.5 rounded ${i === 1 ? "bg-primary/20 text-primary" : "text-muted-foreground/60"}`}>{t}</span>
                          ))}
                        </div>
                      </div>
                      <svg viewBox="0 0 400 140" className="w-full h-[calc(100%-2.5rem)]" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(72, 100%, 55%)" stopOpacity="0.35" />
                            <stop offset="100%" stopColor="hsl(72, 100%, 55%)" stopOpacity="0" />
                          </linearGradient>
                          <linearGradient id="lineStroke" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="hsl(72, 100%, 65%)" />
                            <stop offset="100%" stopColor="hsl(72, 100%, 45%)" />
                          </linearGradient>
                        </defs>
                        {/* grid */}
                        {[0, 1, 2, 3].map((i) => (
                          <line key={i} x1="0" x2="400" y1={20 + i * 35} y2={20 + i * 35} stroke="rgba(255,255,255,0.04)" />
                        ))}
                        {/* area */}
                        <motion.path
                          d="M0,110 C40,90 70,95 100,75 C140,50 170,80 210,55 C250,30 290,45 330,25 C360,10 380,15 400,10 L400,140 L0,140 Z"
                          fill="url(#areaFill)"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1.6, duration: 0.8 }}
                        />
                        {/* line */}
                        <motion.path
                          d="M0,110 C40,90 70,95 100,75 C140,50 170,80 210,55 C250,30 290,45 330,25 C360,10 380,15 400,10"
                          fill="none"
                          stroke="url(#lineStroke)"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ delay: 1.2, duration: 1.6, ease: "easeInOut" }}
                        />
                        {/* dots */}
                        {[[100, 75], [210, 55], [330, 25]].map(([x, y], i) => (
                          <motion.circle
                            key={i}
                            cx={x} cy={y} r="3.5"
                            fill="hsl(72, 100%, 55%)"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 2.2 + i * 0.15, type: "spring", stiffness: 300 }}
                          />
                        ))}
                      </svg>
                    </motion.div>

                    {/* Activity panel */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.3, duration: 0.6 }}
                      className="hidden lg:flex col-span-1 rounded-xl border border-white/5 bg-white/[0.02] p-4 h-56 flex-col"
                    >
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground/80 mb-3">Activité</div>
                      <div className="space-y-2.5 flex-1">
                        {[
                          { c: "bg-primary", t: "Nouvelle réservation" },
                          { c: "bg-primary/60", t: "Facture #218 payée" },
                          { c: "bg-white/40", t: "Client ajouté" },
                          { c: "bg-primary/40", t: "Tâche complétée" },
                        ].map((a, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1.6 + i * 0.1 }}
                            className="flex items-center gap-2"
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${a.c}`} />
                            <span className="text-[10px] text-foreground/80 flex-1 truncate">{a.t}</span>
                            <span className="text-[9px] text-muted-foreground/50">{i + 1}m</span>
                          </motion.div>
                        ))}
                      </div>
                      <div className="h-8 flex items-end gap-1 mt-2">
                        {[40, 60, 35, 80, 55, 90, 70, 100, 65, 85].map((h, i) => (
                          <motion.div
                            key={i}
                            initial={{ height: 0 }}
                            animate={{ height: `${h}%` }}
                            transition={{ delay: 2 + i * 0.05, duration: 0.4 }}
                            className="flex-1 bg-primary/60 rounded-sm"
                          />
                        ))}
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Bottom sheen sweep */}
              <motion.div
                aria-hidden
                initial={{ x: "-100%" }}
                animate={{ x: "200%" }}
                transition={{ delay: 2.5, duration: 2.2, ease: "easeInOut", repeat: Infinity, repeatDelay: 4 }}
                className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-primary/10 to-transparent skew-x-12"
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
      <section ref={statsRef} className="relative py-14 border-y border-white/5">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-10">
            <ScrollStat
              scrollProgress={statsScrollProgress}
              prefix="+"
              values={[120, 250, 500, 120]}
              label="Agences accompagnées"
              index={0}
            />
            <ScrollStat
              scrollProgress={statsScrollProgress}
              values={[8500, 12000, 25000, 8500]}
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
      <section id="features" className="py-20 sm:py-32 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="container mx-auto px-4 sm:px-6 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mb-14"
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
      <section id="how" className="py-20 sm:py-32 border-t border-white/5">
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
      <section id="benefits" className="py-20 sm:py-32 border-t border-white/5">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-16"
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

      {/* ============== TESTIMONIAL ============== */}
      <section className="py-24 sm:py-32 border-t border-white/5 relative overflow-hidden">
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
      <section className="py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative rounded-[2rem] overflow-hidden border border-primary/30 bg-gradient-to-br from-card via-card/80 to-background"
          >
            <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(212,255,58,0.08)_1px,transparent_0)] [background-size:32px_32px] opacity-50" />

            <div className="relative px-6 sm:px-12 md:px-20 py-16 sm:py-24 text-center">
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
