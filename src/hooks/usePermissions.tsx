import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useUserRole } from "./useUserRole";
import type { Database } from "@/integrations/supabase/types";

export type AppPermission = Database["public"]["Enums"]["app_permission"];

// All available permissions
export const ALL_PERMISSIONS: AppPermission[] = [
  // Clients
  "creer_client",
  "voir_client",
  "modifier_client",
  "supprimer_client",
  
  // Devis
  "creer_devis",
  "voir_devis",
  "modifier_devis",
  "supprimer_devis",
  "envoyer_devis",
  
  // Factures
  "creer_facture",
  "voir_facture",
  "modifier_facture",
  "supprimer_facture",
  "generer_pdf_facture",
  
  // Revenus
  "voir_revenus",
  "ajouter_revenu",
  
  // Dépenses
  "voir_depenses",
  "ajouter_depense",
  
  // Documents IA
  "creer_document_ia",
  "voir_document_ia",
  "telecharger_document_ia",
  
  // Tâches
  "creer_tache",
  "assigner_tache",
  "voir_tache",
  "modifier_tache",
  "cloturer_tache",
  
  // Statistiques
  "voir_statistiques_globales",
  "voir_statistiques_personnelles",
  
  // Utilisateurs
  "gerer_utilisateurs",
  "gerer_parametres",
];

// Permission categories for UI grouping
export const PERMISSION_CATEGORIES = {
  clients: {
    label: "Clients",
    permissions: ["creer_client", "voir_client", "modifier_client", "supprimer_client"] as AppPermission[],
  },
  devis: {
    label: "Devis",
    permissions: ["creer_devis", "voir_devis", "modifier_devis", "supprimer_devis", "envoyer_devis"] as AppPermission[],
  },
  factures: {
    label: "Factures",
    permissions: ["creer_facture", "voir_facture", "modifier_facture", "supprimer_facture", "generer_pdf_facture"] as AppPermission[],
  },
  revenus: {
    label: "Revenus",
    permissions: ["voir_revenus", "ajouter_revenu"] as AppPermission[],
  },
  depenses: {
    label: "Dépenses",
    permissions: ["voir_depenses", "ajouter_depense"] as AppPermission[],
  },
  documents: {
    label: "Documents IA",
    permissions: ["creer_document_ia", "voir_document_ia", "telecharger_document_ia"] as AppPermission[],
  },
  taches: {
    label: "Tâches",
    permissions: ["creer_tache", "assigner_tache", "voir_tache", "modifier_tache", "cloturer_tache"] as AppPermission[],
  },
  statistiques: {
    label: "Statistiques",
    permissions: ["voir_statistiques_globales", "voir_statistiques_personnelles"] as AppPermission[],
  },
  administration: {
    label: "Administration",
    permissions: ["gerer_utilisateurs", "gerer_parametres"] as AppPermission[],
  },
};

// Permission labels for display
export const PERMISSION_LABELS: Record<AppPermission, string> = {
  creer_client: "Créer un client",
  voir_client: "Voir les clients",
  modifier_client: "Modifier un client",
  supprimer_client: "Supprimer un client",
  creer_devis: "Créer un devis",
  voir_devis: "Voir les devis",
  modifier_devis: "Modifier un devis",
  supprimer_devis: "Supprimer un devis",
  envoyer_devis: "Envoyer un devis",
  creer_facture: "Créer une facture",
  voir_facture: "Voir les factures",
  modifier_facture: "Modifier une facture",
  supprimer_facture: "Supprimer une facture",
  generer_pdf_facture: "Générer PDF facture",
  voir_revenus: "Voir les revenus",
  ajouter_revenu: "Ajouter un revenu",
  voir_depenses: "Voir les dépenses",
  ajouter_depense: "Ajouter une dépense",
  creer_document_ia: "Créer un document IA",
  voir_document_ia: "Voir les documents IA",
  telecharger_document_ia: "Télécharger document IA",
  creer_tache: "Créer une tâche",
  assigner_tache: "Assigner une tâche",
  voir_tache: "Voir les tâches",
  modifier_tache: "Modifier une tâche",
  cloturer_tache: "Clôturer une tâche",
  voir_statistiques_globales: "Voir statistiques globales",
  voir_statistiques_personnelles: "Voir statistiques personnelles",
  gerer_utilisateurs: "Gérer les utilisateurs",
  gerer_parametres: "Gérer les paramètres",
};

interface UsePermissionsReturn {
  permissions: AppPermission[];
  loading: boolean;
  hasPermission: (permission: AppPermission) => boolean;
  hasAnyPermission: (permissions: AppPermission[]) => boolean;
  hasAllPermissions: (permissions: AppPermission[]) => boolean;
  refetch: () => Promise<void>;
}

export const usePermissions = (): UsePermissionsReturn => {
  const { user } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const [permissions, setPermissions] = useState<AppPermission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = useCallback(async () => {
    if (!user) {
      setPermissions([]);
      setLoading(false);
      return;
    }

    try {
      // Call the database function to get user permissions
      const { data, error } = await supabase.rpc("get_user_permissions", {
        _user_id: user.id,
      });

      if (error) {
        console.error("Error fetching permissions:", error);
        setPermissions([]);
      } else {
        setPermissions((data as AppPermission[]) || []);
      }
    } catch (error) {
      console.error("Error fetching permissions:", error);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!roleLoading) {
      fetchPermissions();
    }
  }, [user, role, roleLoading, fetchPermissions]);

  const hasPermission = useCallback(
    (permission: AppPermission): boolean => {
      return permissions.includes(permission);
    },
    [permissions]
  );

  const hasAnyPermission = useCallback(
    (perms: AppPermission[]): boolean => {
      return perms.some((p) => permissions.includes(p));
    },
    [permissions]
  );

  const hasAllPermissions = useCallback(
    (perms: AppPermission[]): boolean => {
      return perms.every((p) => permissions.includes(p));
    },
    [permissions]
  );

  return {
    permissions,
    loading: loading || roleLoading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    refetch: fetchPermissions,
  };
};
