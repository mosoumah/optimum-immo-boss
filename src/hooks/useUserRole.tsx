import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UseUserRoleReturn {
  role: AppRole | null;
  loading: boolean;
  isAdmin: boolean;
  isAgent: boolean;
  isClient: boolean;
  clientId: string | null;
  hasNoRole: boolean;
  refetch: () => Promise<void>;
}

export const useUserRole = (): UseUserRoleReturn => {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasNoRole, setHasNoRole] = useState(false);

  const fetchRole = useCallback(async () => {
    if (!user) {
      setRole(null);
      setClientId(null);
      setHasNoRole(false);
      setLoading(false);
      return;
    }

    try {
      // Fetch user role
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (roleError) {
        console.error("Error fetching role:", roleError);
      }

      const userRole = roleData?.role as AppRole | null;
      setRole(userRole);
      setHasNoRole(!userRole);

      // If user is a client, fetch their client_id
      if (userRole === "client") {
        const { data: clientAccount } = await supabase
          .from("client_accounts")
          .select("client_id")
          .eq("user_id", user.id)
          .maybeSingle();

        setClientId(clientAccount?.client_id || null);
      } else {
        setClientId(null);
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
      setHasNoRole(true);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRole();
  }, [fetchRole]);

  return {
    role,
    loading,
    isAdmin: role === "admin",
    isAgent: role === "agent",
    isClient: role === "client",
    clientId,
    hasNoRole,
    refetch: fetchRole,
  };
};
