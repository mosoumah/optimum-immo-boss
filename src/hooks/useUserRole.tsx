import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UseUserRoleReturn {
  role: AppRole | null;
  loading: boolean;
  error: Error | null;
  isAdmin: boolean;
  isAgent: boolean;
  isClient: boolean;
  clientId: string | null;
  refetch: () => Promise<void>;
}

export const useUserRole = (): UseUserRoleReturn => {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRole = useCallback(async () => {
    if (!user) {
      setRole(null);
      setClientId(null);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setError(null);
      
      // Fetch user role - with .limit(1) for extra safety
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (roleError) {
        throw roleError;
      }

      const userRole = roleData?.role as AppRole | null;
      setRole(userRole);

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
    } catch (err) {
      console.error("Error fetching user role:", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRole();
  }, [fetchRole]);

  const refetch = useCallback(async () => {
    setLoading(true);
    await fetchRole();
  }, [fetchRole]);

  return {
    role,
    loading,
    error,
    isAdmin: role === "admin",
    isAgent: role === "agent",
    isClient: role === "client",
    clientId,
    refetch,
  };
};
