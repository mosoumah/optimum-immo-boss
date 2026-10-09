import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, ArrowLeft, Save, Loader2, User } from "lucide-react";
import { FloatingParticles } from "@/components/FloatingParticles";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useEntreprise } from "@/hooks/useEntreprise";
import { useAuth } from "@/hooks/useAuth";
import { DynamicSidebar } from "@/components/DynamicSidebar";
import { toast } from "sonner";
import {
  PERMISSION_CATEGORIES,
  PERMISSION_LABELS,
  type AppPermission,
} from "@/hooks/usePermissions";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UserWithRole {
  id: string;
  nom: string;
  email: string;
  role: AppRole | null;
}

interface UserPermission {
  permission: AppPermission;
  granted: boolean;
}

const GestionPermissions = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { entrepriseId, isLoading: entrepriseLoading } = useEntreprise();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);
  const [roleDefaultPermissions, setRoleDefaultPermissions] = useState<AppPermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const fetchUsers = useCallback(async () => {
    if (!entrepriseId) return;

    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, nom, email")
      .eq("entreprise_id", entrepriseId);

    if (!profilesData) {
      setIsLoading(false);
      return;
    }

    // Get roles for each user
    const usersWithRoles: UserWithRole[] = [];
    for (const profile of profilesData) {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", profile.id)
        .maybeSingle();

      usersWithRoles.push({
        ...profile,
        role: roleData?.role as AppRole | null,
      });
    }

    setUsers(usersWithRoles);
    setIsLoading(false);
  }, [entrepriseId]);

  const fetchRolePermissions = useCallback(async (role: AppRole) => {
    const { data } = await supabase
      .from("role_permissions")
      .select("permission")
      .eq("role", role);

    return (data?.map((d) => d.permission) as AppPermission[]) || [];
  }, []);

  const fetchUserCustomPermissions = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("user_permissions")
      .select("permission, granted")
      .eq("user_id", userId);

    return (data?.map((d) => ({
      permission: d.permission as AppPermission,
      granted: d.granted,
    })) || []);
  }, []);

  const handleSelectUser = async (user: UserWithRole) => {
    setSelectedUser(user);
    
    // Fetch role default permissions
    if (user.role) {
      const rolePerms = await fetchRolePermissions(user.role);
      setRoleDefaultPermissions(rolePerms);
    } else {
      setRoleDefaultPermissions([]);
    }

    // Fetch user custom permissions
    const customPerms = await fetchUserCustomPermissions(user.id);
    setUserPermissions(customPerms);
  };

  const getEffectivePermission = (permission: AppPermission): boolean => {
    // Check custom permission first
    const custom = userPermissions.find((p) => p.permission === permission);
    if (custom !== undefined) {
      return custom.granted;
    }
    // Fall back to role default
    return roleDefaultPermissions.includes(permission);
  };

  const isCustomized = (permission: AppPermission): boolean => {
    return userPermissions.some((p) => p.permission === permission);
  };

  const togglePermission = (permission: AppPermission) => {
    const currentValue = getEffectivePermission(permission);
    const isRoleDefault = roleDefaultPermissions.includes(permission);

    setUserPermissions((prev) => {
      const existing = prev.find((p) => p.permission === permission);
      
      if (existing) {
        // If toggling back to role default, remove the custom entry
        if ((!currentValue && isRoleDefault) || (currentValue && !isRoleDefault)) {
          return prev.filter((p) => p.permission !== permission);
        }
        // Otherwise update the value
        return prev.map((p) =>
          p.permission === permission ? { ...p, granted: !currentValue } : p
        );
      } else {
        // Add new custom permission
        return [...prev, { permission, granted: !currentValue }];
      }
    });
  };

  const resetToDefault = (permission: AppPermission) => {
    setUserPermissions((prev) => prev.filter((p) => p.permission !== permission));
  };

  const savePermissions = async () => {
    if (!selectedUser) return;

    setIsSaving(true);

    try {
      // Delete all existing custom permissions for this user
      await supabase
        .from("user_permissions")
        .delete()
        .eq("user_id", selectedUser.id);

      // Insert new custom permissions
      if (userPermissions.length > 0) {
        const { error } = await supabase.from("user_permissions").insert(
          userPermissions.map((p) => ({
            user_id: selectedUser.id,
            permission: p.permission,
            granted: p.granted,
          }))
        );

        if (error) throw error;
      }

      toast.success("Permissions mises à jour avec succès");
    } catch (error) {
      console.error("Error saving permissions:", error);
      toast.error("Erreur lors de la sauvegarde des permissions");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (entrepriseId) {
      fetchUsers();
    }
  }, [entrepriseId, fetchUsers]);

  const getRoleBadge = (role: AppRole | null) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-primary/10 text-primary">Admin</Badge>;
      case "agent":
        return <Badge className="bg-blue-500/10 text-blue-500">Agent</Badge>;
      case "client":
        return <Badge className="bg-muted text-muted-foreground">Client</Badge>;
      default:
        return <Badge variant="outline">Aucun rôle</Badge>;
    }
  };

  if (entrepriseLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex relative overflow-x-hidden">
      <FloatingParticles count={25} />
      <DynamicSidebar onSignOut={handleSignOut} />
      
      <main className="flex-1 lg:ml-64 mesh-gradient min-h-screen">
        <div className="p-4 lg:p-8">
          <div className="max-w-6xl mx-auto relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-8 premium-header rounded-xl p-4"
          >
            <Button variant="ghost" size="icon" asChild>
              <Link to="/parametres">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Gestion des Permissions</h1>
              <p className="text-muted-foreground">
                Personnalisez les permissions par utilisateur
              </p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Users List */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-1"
            >
              <div className="rounded-xl border border-border/50 overflow-hidden premium-card">
                <div className="p-4 border-b border-border/50">
                  <h3 className="font-semibold flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Utilisateurs
                  </h3>
                </div>
                <div className="divide-y divide-border/50 max-h-[600px] overflow-y-auto">
                  {users.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      className={`w-full p-4 text-left hover:bg-secondary/30 transition-colors ${
                        selectedUser?.id === user.id ? "bg-secondary/50" : ""
                      }`}
                    >
                      <div className="font-medium">{user.nom || "Sans nom"}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                      <div className="mt-2">{getRoleBadge(user.role)}</div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Permissions Editor */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-2"
            >
              {selectedUser ? (
                <div className="rounded-xl border border-border/50 overflow-hidden premium-card">
                  <div className="p-4 border-b border-border/50 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Permissions de {selectedUser.nom || selectedUser.email}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Rôle par défaut : {selectedUser.role || "aucun"}
                      </p>
                    </div>
                    <Button
                      onClick={savePermissions}
                      disabled={isSaving}
                      className="premium-button"
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Enregistrer
                    </Button>
                  </div>

                  <Tabs defaultValue="clients" className="p-4">
                    <TabsList className="mb-4 flex-wrap h-auto gap-1">
                      {Object.entries(PERMISSION_CATEGORIES).map(([key, category]) => (
                        <TabsTrigger key={key} value={key} className="text-xs">
                          {category.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {Object.entries(PERMISSION_CATEGORIES).map(([key, category]) => (
                      <TabsContent key={key} value={key} className="space-y-2">
                        {category.permissions.map((permission) => {
                          const isEnabled = getEffectivePermission(permission);
                          const isCustom = isCustomized(permission);
                          const isDefault = roleDefaultPermissions.includes(permission);

                          return (
                            <div
                              key={permission}
                              className={`p-3 rounded-lg border ${
                                isCustom
                                  ? "border-primary/30 bg-primary/5"
                                  : "border-border/50"
                              } flex items-center justify-between`}
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {PERMISSION_LABELS[permission]}
                                  </span>
                                  {isCustom && (
                                    <Badge variant="outline" className="text-xs">
                                      Personnalisé
                                    </Badge>
                                  )}
                                  {isDefault && !isCustom && (
                                    <Badge variant="secondary" className="text-xs">
                                      Par défaut
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {permission}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {isCustom && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => resetToDefault(permission)}
                                    className="text-xs"
                                  >
                                    Réinitialiser
                                  </Button>
                                )}
                                <Switch
                                  checked={isEnabled}
                                  onCheckedChange={() => togglePermission(permission)}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </TabsContent>
                    ))}
                  </Tabs>
                </div>
              ) : (
                <div className="rounded-xl border border-border/50 p-12 text-center premium-card">
                  <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Sélectionnez un utilisateur pour gérer ses permissions
                  </p>
                </div>
              )}
            </motion.div>
          </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default GestionPermissions;
