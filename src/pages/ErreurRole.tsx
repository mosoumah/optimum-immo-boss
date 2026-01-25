import { motion } from "framer-motion";
import { AlertTriangle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const ErreurRole = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/connexion");
  };

  return (
    <div className="min-h-screen flex items-center justify-center mesh-gradient p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full text-center"
      >
        <div className="card-gradient rounded-2xl border border-border/30 p-8 space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-warning" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Compte non configuré</h1>
            <p className="text-muted-foreground">
              Votre compte utilisateur n'a pas encore de rôle assigné. 
              Veuillez contacter l'administrateur de votre entreprise pour 
              finaliser la configuration de votre accès.
            </p>
          </div>

          <Button
            onClick={handleSignOut}
            variant="outline"
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            Se déconnecter
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default ErreurRole;
