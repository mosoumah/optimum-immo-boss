import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useEntreprise = () => {
  const { user, loading: authLoading } = useAuth();
  const [entrepriseId, setEntrepriseId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    
    const fetchEntrepriseId = async () => {
      if (!user) {
        setEntrepriseId(null);
        setIsLoading(false);
        return;
      }

      // Use SECURITY DEFINER RPC to bypass RLS timing issues
      const { data, error } = await supabase.rpc("get_user_entreprise_id", {
        _user_id: user.id,
      });

      if (!error && data) {
        setEntrepriseId(data as string);
      } else {
        setEntrepriseId(null);
      }
      setIsLoading(false);
    };

    fetchEntrepriseId();
  }, [user, authLoading]);

  return { entrepriseId, isLoading: isLoading || authLoading };
};
