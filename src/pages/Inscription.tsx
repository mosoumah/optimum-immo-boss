import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, Mail, Lock, User, ArrowRight, Eye, EyeOff, Sparkles, Shield, Zap, CheckCircle2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const Inscription = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { signUp, user } = useAuth();

  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    password: "",
    entreprise: "",
  });

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.nom.trim().length < 2 || formData.nom.length > 100) {
      toast({ title: "Nom invalide", description: "Le nom doit contenir entre 2 et 100 caractères.", variant: "destructive" });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({ title: "Email invalide", description: "Veuillez entrer une adresse email valide.", variant: "destructive" });
      return;
    }
    if (formData.password.length < 8) {
      toast({ title: "Mot de passe trop court", description: "Le mot de passe doit contenir au moins 8 caractères.", variant: "destructive" });
      return;
    }
    if (formData.entreprise.trim().length < 2 || formData.entreprise.length > 100) {
      toast({ title: "Nom d'entreprise invalide", description: "Le nom d'entreprise doit contenir entre 2 et 100 caractères.", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    const { error } = await signUp(
      formData.email,
      formData.password,
      formData.nom,
      formData.entreprise
    );

    if (error) {
      toast({
        title: "Erreur lors de l'inscription",
        description: error.message === "User already registered"
          ? "Cet email est déjà utilisé. Veuillez vous connecter."
          : error.message,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    toast({
      title: "Bienvenue chez Optimum Immo ✨",
      description: "Votre essai gratuit de 14 jours commence maintenant.",
    });

    setIsLoading(false);
    navigate("/profil-entreprise");
  };

  const benefits = [
    { icon: Sparkles, title: "Studio IA inclus", desc: "Rédigez fiches et documents en quelques secondes" },
    { icon: Zap, title: "Facturation automatisée", desc: "Devis, factures et reçus en un clic" },
    { icon: Building2, title: "Gestion des biens", desc: "Portefeuille, réservations et disponibilités" },
    { icon: Shield, title: "Données sécurisées", desc: "Hébergement conforme, sauvegardes quotidiennes" },
  ];

  return (
    <div className="min-h-screen flex bg-background relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{ background: "var(--gradient-mesh)" }} />
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full blur-3xl opacity-30 bg-primary/20" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full blur-3xl opacity-20 bg-primary/10" />
      </div>

      {/* Left Panel - Brand storytelling */}
      <div className="hidden lg:flex lg:w-[55%] relative">
        <div className="relative z-10 flex flex-col justify-between p-14 w-full">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link to="/" className="inline-block">
              <Logo size="lg" />
            </Link>
          </motion.div>

          <div className="space-y-10 max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="space-y-5"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-medium tracking-wide text-primary">14 jours d'essai gratuit — sans carte bancaire</span>
              </div>
              <h1 className="text-5xl xl:text-6xl font-bold leading-[1.05] tracking-tight">
                L'agence immobilière{" "}
                <span className="relative inline-block">
                  <span className="text-gradient bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
                    nouvelle génération
                  </span>
                  <motion.span
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="absolute -bottom-1 left-0 right-0 h-[3px] bg-gradient-to-r from-primary to-transparent origin-left"
                  />
                </span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Clients, biens, réservations, factures et intelligence artificielle — réunis dans un seul outil, pensé pour les agences immobilières guinéennes qui veulent aller plus vite, plus loin, plus sereinement.
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.08, delayChildren: 0.3 } },
              }}
              className="grid grid-cols-2 gap-3"
            >
              {benefits.map((b, i) => (
                <motion.div
                  key={i}
                  variants={{
                    hidden: { opacity: 0, y: 12 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  className="group relative p-4 rounded-xl border border-border/40 bg-card/40 backdrop-blur-sm hover:border-primary/40 hover:bg-card/60 transition-all duration-300"
                >
                  <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "var(--gradient-primary-soft)" }} />
                  <div className="relative flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <b.icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-foreground">{b.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{b.desc}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="flex items-center gap-4 pt-2"
            >
              <div className="flex -space-x-2">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-9 h-9 rounded-full border-2 border-background bg-gradient-to-br from-primary/40 to-primary/10 flex items-center justify-center text-xs font-bold text-primary-foreground"
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Approuvé par les agences immobilières de Conakry
                </p>
              </div>
            </motion.div>
          </div>

          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Optimum Immo — Fait avec passion en Guinée 🇬🇳
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-6 lg:p-10 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden mb-8 flex justify-center">
            <Link to="/">
              <Logo size="md" />
            </Link>
          </div>

          <div className="relative">
            {/* Glow behind card */}
            <div className="absolute -inset-1 rounded-3xl opacity-60 blur-2xl" style={{ background: "var(--gradient-primary-soft)" }} />

            <div className="relative rounded-3xl border border-border/50 bg-card/60 backdrop-blur-2xl p-8 lg:p-9 shadow-2xl">
              <div className="mb-7">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
                  <CheckCircle2 className="w-3 h-3 text-primary" />
                  <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">14 jours offerts</span>
                </div>
                <h2 className="text-3xl font-bold tracking-tight mb-1.5">Créer votre compte</h2>
                <p className="text-sm text-muted-foreground">
                  Déjà membre ?{" "}
                  <Link to="/connexion" className="text-primary hover:underline font-medium">
                    Se connecter
                  </Link>
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="nom" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nom complet</Label>
                  <div className="relative group">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="nom"
                      type="text"
                      placeholder="Ex : Mamadou Diallo"
                      className="pl-10 h-12 bg-secondary/40 border-border/50 focus:border-primary focus:bg-secondary/60 transition-all"
                      value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email professionnel</Label>
                  <div className="relative group">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="vous@agence.gn"
                      className="pl-10 h-12 bg-secondary/40 border-border/50 focus:border-primary focus:bg-secondary/60 transition-all"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Mot de passe</Label>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimum 8 caractères"
                      className="pl-10 pr-10 h-12 bg-secondary/40 border-border/50 focus:border-primary focus:bg-secondary/60 transition-all"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="entreprise" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nom de votre agence</Label>
                  <div className="relative group">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="entreprise"
                      type="text"
                      placeholder="Ex : Diallo Immobilier"
                      className="pl-10 h-12 bg-secondary/40 border-border/50 focus:border-primary focus:bg-secondary/60 transition-all"
                      value={formData.entreprise}
                      onChange={(e) => setFormData({ ...formData, entreprise: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="pt-2">
                  <Button
                    type="submit"
                    variant="hero"
                    size="lg"
                    className="w-full h-12 group relative overflow-hidden"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    ) : (
                      <>
                        <span className="relative z-10">Démarrer mon essai gratuit</span>
                        <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                </motion.div>

                <div className="flex items-center justify-center gap-4 pt-1 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-primary" />
                    <span>Sans carte bancaire</span>
                  </div>
                  <div className="w-1 h-1 rounded-full bg-border" />
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-primary" />
                    <span>Annulez à tout moment</span>
                  </div>
                </div>

                <p className="text-[11px] text-center text-muted-foreground pt-2 leading-relaxed">
                  En créant un compte, vous acceptez nos{" "}
                  <span className="text-primary hover:underline cursor-pointer">conditions d'utilisation</span>
                  {" "}et notre{" "}
                  <span className="text-primary hover:underline cursor-pointer">politique de confidentialité</span>.
                </p>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Inscription;
