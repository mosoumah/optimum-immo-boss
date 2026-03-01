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
  refetch: () => Promise<void>;
}

export const useUserRole = (): UseUserRoleReturn => {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRole = useCallback(async () => {
    if (!user) {
      setRole(null);
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
    refetch,
  };
};
