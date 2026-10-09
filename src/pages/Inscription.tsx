import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Building2,
  Mail,
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  Shield,
  Zap,
  CheckCircle2,
  CreditCard,
  Infinity as InfinityIcon,
} from "lucide-react";
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
    const { error } = await signUp(formData.email, formData.password, formData.nom, formData.entreprise);

    if (error) {
      toast({
        title: "Erreur lors de l'inscription",
        description:
          error.message === "User already registered"
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

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{ background: "var(--gradient-mesh)" }} />
        <div className="absolute top-1/4 -left-40 w-[520px] h-[520px] rounded-full blur-3xl opacity-30 bg-primary/20" />
        <div className="absolute bottom-0 -right-40 w-[600px] h-[600px] rounded-full blur-3xl opacity-20 bg-primary/10" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col lg:flex-row">
        {/* LEFT — Editorial hero */}
        <div className="hidden lg:flex lg:w-[52%] flex-col justify-between p-12 xl:p-16 relative">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link to="/" className="inline-block">
              <Logo size="lg" />
            </Link>
          </motion.div>

          <div className="space-y-10 max-w-xl">
            {/* Hero: giant "14 jours" typographic statement */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="relative"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/40 bg-primary/10 backdrop-blur-sm mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-primary">
                  Offre de lancement
                </span>
              </div>

              <div className="flex items-start gap-5">
                <div className="relative">
                  <div
                    className="text-[8rem] xl:text-[10rem] font-black leading-[0.85] tracking-tighter bg-gradient-to-br from-primary via-primary to-primary/40 bg-clip-text text-transparent"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    14
                  </div>
                  <div className="absolute -inset-4 blur-3xl bg-primary/20 -z-10" />
                </div>
                <div className="pt-4">
                  <div className="text-2xl xl:text-3xl font-bold leading-tight">
                    jours d'essai
                    <br />
                    <span className="text-primary">100&nbsp;% gratuits</span>
                  </div>
                  <div className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-[240px]">
                    Sans carte bancaire. Sans engagement. Toutes les fonctionnalités débloquées.
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Bento — elevated 14 days benefits */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.07, delayChildren: 0.4 } },
              }}
              className="grid grid-cols-6 gap-3"
            >
              {/* Big card */}
              <motion.div
                variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                className="col-span-6 relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/[0.12] via-primary/[0.04] to-transparent p-5"
              >
                <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-primary/20 blur-3xl" />
                <div className="relative flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-foreground">Toutes les fonctionnalités Pro incluses</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Studio IA, facturation, biens, réservations, équipe — rien n'est bridé.
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Small tiles */}
              {[
                { icon: CreditCard, title: "Sans CB", desc: "Aucun paiement demandé" },
                { icon: InfinityIcon, title: "Illimité", desc: "Clients & biens" },
                { icon: Shield, title: "Sécurisé", desc: "Données chiffrées" },
              ].map((b, i) => (
                <motion.div
                  key={i}
                  variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                  className="col-span-2 group relative rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm p-4 hover:border-primary/40 transition-colors"
                >
                  <b.icon className="w-4 h-4 text-primary mb-2" />
                  <div className="text-sm font-semibold">{b.title}</div>
                  <div className="text-[11px] text-muted-foreground leading-snug mt-0.5">{b.desc}</div>
                </motion.div>
              ))}

              {/* Wide countdown card */}
              <motion.div
                variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                className="col-span-6 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Prêt en moins de 2 minutes
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-primary">01:47</span>
                </div>
                <div className="flex items-center gap-2">
                  {["Compte", "Agence", "Équipe", "C'est parti"].map((step, i) => (
                    <div key={step} className="flex-1 flex items-center gap-2">
                      <div
                        className={`flex-1 h-1 rounded-full ${i < 3 ? "bg-primary" : "bg-border"}`}
                      />
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap hidden xl:inline">
                        {step}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </div>

          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Optimum Immo — Conçu en Guinée 🇬🇳
          </p>
        </div>

        {/* Vertical divider */}
        <div className="hidden lg:block w-px bg-gradient-to-b from-transparent via-border to-transparent" />

        {/* RIGHT — Form */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-10">
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

            {/* Mobile-only trial banner */}
            <div className="lg:hidden mb-6 rounded-2xl border border-primary/30 bg-primary/5 p-4 flex items-center gap-3">
              <div className="text-4xl font-black leading-none text-primary">14</div>
              <div>
                <div className="text-sm font-semibold">jours d'essai gratuits</div>
                <div className="text-[11px] text-muted-foreground">Sans carte bancaire · Tout inclus</div>
              </div>
            </div>

            <div className="mb-7">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-2">
                Étape 1 sur 3 · Création du compte
              </div>
              <h2 className="text-3xl xl:text-4xl font-bold tracking-tight leading-tight mb-2">
                Créez votre espace en <span className="text-primary">2 minutes</span>.
              </h2>
              <p className="text-sm text-muted-foreground">
                Déjà membre ?{" "}
                <Link to="/connexion" className="text-primary hover:underline font-medium">
                  Se connecter
                </Link>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="nom" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Nom complet
                  </Label>
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
                  <Label htmlFor="entreprise" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Nom de votre agence
                  </Label>
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

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Email professionnel
                  </Label>
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
                  <Label htmlFor="password" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Mot de passe
                  </Label>
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
                      <span className="relative z-10">Démarrer mes 14 jours gratuits</span>
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
                <span className="text-primary hover:underline cursor-pointer">conditions d'utilisation</span> et notre{" "}
                <span className="text-primary hover:underline cursor-pointer">politique de confidentialité</span>.
              </p>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Inscription;
