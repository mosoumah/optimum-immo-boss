import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface PermissionDeniedProps {
  message?: string;
  showBackButton?: boolean;
}

export const PermissionDenied = ({
  message = "Vous n'avez pas les permissions nécessaires pour accéder à cette fonctionnalité.",
  showBackButton = true,
}: PermissionDeniedProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <ShieldX className="w-8 h-8 text-destructive" />
      </div>
      <h2 className="text-xl font-semibold text-foreground mb-2">Accès refusé</h2>
      <p className="text-muted-foreground max-w-md mb-6">{message}</p>
      {showBackButton && (
        <Button variant="outline" onClick={() => navigate(-1)}>
          Retour
        </Button>
      )}
    </div>
  );
};
