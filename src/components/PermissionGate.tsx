/* eslint-disable react-refresh/only-export-components */
import { ReactNode } from "react";
import { usePermissions, AppPermission } from "@/hooks/usePermissions";

interface PermissionGateProps {
  children: ReactNode;
  permission?: AppPermission;
  permissions?: AppPermission[];
  requireAll?: boolean;
  fallback?: ReactNode;
  showLoading?: boolean;
}

/**
 * PermissionGate - Conditionally renders children based on user permissions
 * 
 * Usage:
 * - Single permission: <PermissionGate permission="creer_client">...</PermissionGate>
 * - Multiple (any): <PermissionGate permissions={["creer_client", "modifier_client"]}>...</PermissionGate>
 * - Multiple (all): <PermissionGate permissions={["creer_client", "modifier_client"]} requireAll>...</PermissionGate>
 */
export const PermissionGate = ({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  showLoading = false,
}: PermissionGateProps) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermissions();

  if (loading && showLoading) {
    return (
      <div className="animate-pulse bg-muted rounded h-8 w-24" />
    );
  }

  if (loading) {
    return null;
  }

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions && permissions.length > 0) {
    hasAccess = requireAll 
      ? hasAllPermissions(permissions) 
      : hasAnyPermission(permissions);
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

/**
 * Hook-based permission check for programmatic use
 */
export const useCanAccess = (
  permission?: AppPermission,
  permissions?: AppPermission[],
  requireAll = false
): { canAccess: boolean; loading: boolean } => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermissions();

  if (loading) {
    return { canAccess: false, loading: true };
  }

  let canAccess = false;

  if (permission) {
    canAccess = hasPermission(permission);
  } else if (permissions && permissions.length > 0) {
    canAccess = requireAll 
      ? hasAllPermissions(permissions) 
      : hasAnyPermission(permissions);
  }

  return { canAccess, loading };
};
