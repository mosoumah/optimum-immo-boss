import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AppPermission = Database["public"]["Enums"]["app_permission"];

/**
 * Server-side permission check using the database function
 * Use this for critical operations before executing them
 */
export const checkPermission = async (permission: AppPermission): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return false;
    }

    const { data, error } = await supabase.rpc("has_permission", {
      _user_id: user.id,
      _permission: permission,
    });

    if (error) {
      console.error("Permission check error:", error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error("Permission check error:", error);
    return false;
  }
};

/**
 * Throws an error if the user doesn't have the required permission
 */
export const requirePermission = async (permission: AppPermission): Promise<void> => {
  const hasPermission = await checkPermission(permission);
  
  if (!hasPermission) {
    throw new Error(`Permission refusée: ${permission}`);
  }
};

/**
 * Check multiple permissions - returns true if user has any of them
 */
export const checkAnyPermission = async (permissions: AppPermission[]): Promise<boolean> => {
  for (const permission of permissions) {
    if (await checkPermission(permission)) {
      return true;
    }
  }
  return false;
};

/**
 * Check multiple permissions - returns true only if user has all of them
 */
export const checkAllPermissions = async (permissions: AppPermission[]): Promise<boolean> => {
  for (const permission of permissions) {
    if (!(await checkPermission(permission))) {
      return false;
    }
  }
  return true;
};
