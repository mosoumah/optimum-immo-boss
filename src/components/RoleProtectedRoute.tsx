import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
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
  redirectTo = "/dashboard"
}: RoleProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading, hasNoRole } = useUserRole();
  const location = useLocation();

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/connexion" state={{ from: location }} replace />;
  }

  // User exists but has no role assigned - redirect to error page
  if (hasNoRole) {
    return <Navigate to="/erreur-role" replace />;
  }

  if (!role || !allowedRoles.includes(role)) {
    // Redirect clients to their portal, others to dashboard
    const redirect = role === "client" ? "/portail-client" : redirectTo;
    return <Navigate to={redirect} replace />;
  }

  return <>{children}</>;
};
