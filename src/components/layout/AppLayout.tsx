import { useNavigate } from "react-router-dom";
import { DynamicSidebar } from "@/components/DynamicSidebar";
import { FloatingParticles } from "@/components/FloatingParticles";
import { useAuth } from "@/hooks/useAuth";

interface AppLayoutProps {
  children: React.ReactNode;
  showParticles?: boolean;
  particleCount?: number;
}

export const AppLayout = ({ 
  children, 
  showParticles = true, 
  particleCount = 25 
}: AppLayoutProps) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex relative">
      {showParticles && <FloatingParticles count={particleCount} />}
      <DynamicSidebar onSignOut={handleSignOut} />
      <main className="flex-1 ml-64 mesh-gradient min-h-screen">
        {children}
      </main>
    </div>
  );
};
