import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Users, 
  FileText, 
  Receipt, 
  TrendingUp, 
  CheckSquare, 
  
  ArrowRight,
  Building2,
  Shield,
  Zap,
  Clock,
  Wallet,
  Database,
  Trophy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FeatureCard } from "@/components/FeatureCard";

const features = [
  {
    icon: Users,
    title: "Gestion des Clients",
    description: "Centralisez toutes les informations de vos clients avec leur historique complet de transactions.",
  },
  {
    icon: Receipt,
    title: "Facturation Simplifiée",
    description: "Générez des factures conformes et suivez les paiements en temps réel.",
  },
  {
    icon: TrendingUp,
    title: "Suivi Financier",
    description: "Visualisez vos revenus, dépenses et bénéfices sur un tableau de bord intuitif.",
  },
  {
    icon: CheckSquare,
    title: "Tâches Intelligentes",
    description: "Ne manquez plus aucune relance grâce aux rappels automatiques alimentés par l'IA.",
  },
];

const benefits = [
  { 
    icon: Clock, 
    title: "Gagnez du temps", 
    description: "Automatisez vos tâches répétitives et concentrez-vous sur l'essentiel." 
  },
  { 
    icon: Wallet, 
    title: "Économisez de l'argent", 
    description: "Réduisez vos coûts opérationnels et maximisez vos profits." 
  },
  { 
    icon: Database, 
    title: "Récoltez des données", 
    description: "Centralisez et analysez toutes vos informations clients." 
  },
  { 
    icon: Trophy, 
    title: "Distinguez-vous", 
    description: "Démarquez-vous de la concurrence avec des outils professionnels." 
  },
];

const Index = () => {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 pattern-dots opacity-30" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-6 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-4xl mx-auto text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8"
            >
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Nouveau: Génération de documents IA</span>
            </motion.div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
              Boostez votre{" "}
              <span className="text-gradient">agence immobilière</span>{" "}
              en Guinée
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Gérez vos clients, factures et documents facilement avec Optimum Immo. 
              La solution tout-en-un pour les professionnels de l'immobilier.
            </p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button variant="hero" size="xl" asChild>
                <Link to="/inscription">
                  Commencer maintenant
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button variant="hero-outline" size="xl" asChild>
                <a href="#features">Découvrir les fonctionnalités</a>
              </Button>
            </motion.div>
          </motion.div>

        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 border-y border-border/30">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Pourquoi choisir <span className="text-gradient">Optimum Immo</span> ?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Des avantages concrets pour propulser votre agence immobilière.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="card-glow rounded-2xl p-6 text-center group"
              >
                <motion.div 
                  initial={{ scale: 0, rotate: -180 }}
                  whileInView={{ scale: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 200, 
                    damping: 15, 
                    delay: index * 0.1 + 0.2 
                  }}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-5 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300"
                >
                  <benefit.icon className="w-8 h-8 text-primary" />
                </motion.div>
                <h3 className="text-xl font-semibold mb-3">{benefit.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tout ce dont vous avez <span className="text-gradient">besoin</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Une suite d'outils puissants conçus spécialement pour les agences immobilières guinéennes.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <FeatureCard key={feature.title} {...feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent" />
            <div className="absolute inset-0 pattern-dots opacity-20" />
            
            <div className="relative card-glow rounded-3xl p-12 md:p-16 text-center">
              <div className="flex justify-center mb-6">
                <motion.div 
                  initial={{ scale: 0, rotate: -180 }}
                  whileInView={{ scale: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20"
                >
                  <Building2 className="w-8 h-8 text-primary" />
                </motion.div>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Prêt à transformer <span className="text-gradient">votre agence</span> ?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Rejoignez des centaines d'agences qui font confiance à Optimum Immo 
                pour gérer leurs opérations quotidiennes.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button variant="hero" size="lg" asChild>
                  <Link to="/inscription">
                    Créer mon compte gratuit
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
              </div>

              <div className="flex items-center justify-center gap-6 mt-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <span>Données sécurisées</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  <span>Configuration rapide</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
