import { useState, useEffect, useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ShieldX, RefreshCw, LogOut } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: AppRole[];
  redirectTo?: string;
}

export const RoleProtectedRoute = ({ 
  children, 
  allowedRoles,
  redirectTo = "/"
}: RoleProtectedRouteProps) => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { role, loading: roleLoading, refetch } = useUserRole();
  const location = useLocation();
  
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [bootstrapAttempted, setBootstrapAttempted] = useState(false);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const bootstrapRef = useRef(false);

  // Bootstrap logic when role is missing
  useEffect(() => {
    const runBootstrap = async () => {
      // Only run once per component lifecycle
      if (bootstrapRef.current) return;
      
      // Only bootstrap if we have a user, finished loading, no role, and haven't tried yet
      if (!user || authLoading || roleLoading || role !== null || bootstrapAttempted) {
        return;
      }

      bootstrapRef.current = true;
      setIsBootstrapping(true);
      setBootstrapError(null);

      try {
        console.log("Bootstrapping user account...");
        const { data, error } = await supabase.rpc("bootstrap_current_user");
        
        if (error) {
          console.error("Bootstrap error:", error);
          setBootstrapError(error.message);
        } else {
          console.log("Bootstrap result:", data);
          // Refetch the role after bootstrap
          await refetch();
        }
      } catch (err) {
        console.error("Bootstrap exception:", err);
        setBootstrapError((err as Error).message);
      } finally {
        setIsBootstrapping(false);
        setBootstrapAttempted(true);
      }
    };

    runBootstrap();
  }, [user, authLoading, roleLoading, role, bootstrapAttempted, refetch]);

  // Loading state
  if (authLoading || roleLoading) {
    return (
      <div className="h-screen flex items-center justify-center overflow-hidden">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/connexion" state={{ from: location }} replace />;
  }

  // Bootstrapping in progress
  if (isBootstrapping) {
    return (
      <div className="h-screen flex flex-col items-center justify-center overflow-hidden gap-4">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-muted-foreground">Configuration de votre compte...</p>
      </div>
    );
  }

  // Role still null after bootstrap attempt - show error UI
  if (role === null) {
    return (
      <div className="h-screen flex flex-col items-center justify-center overflow-hidden p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <ShieldX className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Compte non configuré
        </h2>
        <p className="text-muted-foreground max-w-md mb-2">
          {bootstrapError 
            ? `Erreur lors de la configuration: ${bootstrapError}`
            : "Votre compte n'a pas pu être configuré automatiquement."
          }
        </p>
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          Si le problème persiste, contactez votre administrateur.
        </p>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Réessayer
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => signOut()}
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            Se déconnecter
          </Button>
        </div>
      </div>
    );
  }

  // Role exists but not allowed for this route
  if (!allowedRoles.includes(role)) {
    // Redirect clients to their portal, others to the specified redirect
    const redirect = role === "client" ? "/portail-client" : redirectTo;
    return <Navigate to={redirect} replace />;
  }

  return <>{children}</>;
};
