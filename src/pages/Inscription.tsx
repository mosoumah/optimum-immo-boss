import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, Mail, Lock, User, ArrowRight, Eye, EyeOff } from "lucide-react";
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

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
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
      title: "Compte créé avec succès!",
      description: "Bienvenue sur Optimum Immo. Configurez votre profil entreprise.",
    });

    setIsLoading(false);
    navigate("/profil-entreprise");
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background" />
        <div className="absolute inset-0 pattern-dots opacity-20" />
        
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link to="/">
            <Logo size="lg" />
          </Link>

          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h1 className="text-4xl font-bold leading-tight mb-4">
                Gérez votre agence{" "}
                <span className="text-gradient">comme jamais</span>
              </h1>
              <p className="text-muted-foreground text-lg">
                Rejoignez des centaines d'agences immobilières qui ont déjà 
                transformé leur façon de travailler avec Optimum Immo.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="space-y-4"
            >
              {[
                "Gestion clients centralisée",
                "Facturation automatisée",
                "Gestion des biens immobiliers",
                "Tableau de bord temps réel",
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-foreground">{feature}</span>
                </div>
              ))}
            </motion.div>
          </div>

          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Optimum Immo. Tous droits réservés.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden mb-8">
            <Link to="/">
              <Logo size="md" />
            </Link>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">Créer votre compte</h2>
            <p className="text-muted-foreground">
              Déjà un compte?{" "}
              <Link to="/connexion" className="text-primary hover:underline font-medium">
                Se connecter
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom complet</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="nom"
                  type="text"
                  placeholder="Votre nom"
                  className="pl-10 h-12 bg-secondary/50 border-border/50 focus:border-primary"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  className="pl-10 h-12 bg-secondary/50 border-border/50 focus:border-primary"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10 h-12 bg-secondary/50 border-border/50 focus:border-primary"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="entreprise">Nom de l'entreprise</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="entreprise"
                  type="text"
                  placeholder="Votre agence immobilière"
                  className="pl-10 h-12 bg-secondary/50 border-border/50 focus:border-primary"
                  value={formData.entreprise}
                  onChange={(e) => setFormData({ ...formData, entreprise: e.target.value })}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  Créer mon compte
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              En créant un compte, vous acceptez nos{" "}
              <span className="text-primary hover:underline cursor-pointer">conditions d'utilisation</span>
              {" "}et notre{" "}
              <span className="text-primary hover:underline cursor-pointer">politique de confidentialité</span>.
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Inscription;
