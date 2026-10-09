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
  const { user, loading: authLoading } = useAuth();
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
      
      // Use SECURITY DEFINER RPC to bypass RLS timing issues
      const { data, error: rpcError } = await supabase.rpc("get_user_role", {
        _user_id: user.id,
      });

      if (rpcError) {
        throw rpcError;
      }

      setRole((data as AppRole) || null);
    } catch (err) {
      console.error("Error fetching user role:", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Don't fetch until auth is ready
    if (authLoading) return;
    fetchRole();
  }, [fetchRole, authLoading]);

  const refetch = useCallback(async () => {
    setLoading(true);
    await fetchRole();
  }, [fetchRole]);

  return {
    role,
    loading: loading || authLoading,
    error,
    isAdmin: role === "admin",
    isAgent: role === "agent",
    refetch,
  };
};
