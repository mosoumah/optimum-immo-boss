import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useEntreprise = () => {
  const { user } = useAuth();
  const [entrepriseId, setEntrepriseId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEntrepriseId = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("entreprise_id")
        .eq("id", user.id)
        .maybeSingle();

      setEntrepriseId(profileData?.entreprise_id || null);
      setIsLoading(false);
    };

    fetchEntrepriseId();
  }, [user]);

  return { entrepriseId, isLoading };
};
