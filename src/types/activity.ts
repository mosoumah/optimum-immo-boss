import { supabase } from "@/integrations/supabase/client";

/**
 * Types du journal d'activité.
 *
 * La table `activity_log` existe en production mais n'est pas présente dans
 * `src/integrations/supabase/types.ts` (fichier auto-généré). Les interfaces et
 * les accès typés sont donc isolés ici. Accès strictement en lecture.
 */

export type ActivityAction = "create" | "update" | "delete";

export type ActivityEntityType =
  | "client"
  | "reservation"
  | "facture"
  | "revenu"
  | "depense"
  | "tache"
  | "bien";

/** Contenu de `details` (jsonb). Peut porter les statuts avant/après. */
export interface ActivityDetails {
  statut_avant?: string | null;
  statut_apres?: string | null;
}

/** Ligne de public.activity_log */
export interface ActivityRow {
  id: string;
  entreprise_id: string;
  /** null = action système */
  actor_id: string | null;
  action: ActivityAction;
  entity_type: ActivityEntityType;
  entity_id: string | null;
  /** Texte français prêt à afficher. */
  summary: string;
  details: ActivityDetails | null;
  created_at: string;
}

export interface ProfileName {
  id: string;
  nom: string | null;
}

// Table absente des types générés : cast localisé, aucune modification de types.ts.
type ActivityQuery = {
  select: (columns: string) => {
    eq: (column: string, value: unknown) => {
      gte: (column: string, value: unknown) => {
        order: (column: string, options: { ascending: boolean }) => {
          limit: (count: number) => PromiseLike<{
            data: ActivityRow[] | null;
            error: { message: string } | null;
          }>;
        };
      };
    };
  };
};

type ProfileQuery = {
  select: (columns: string) => {
    in: (column: string, values: string[]) => PromiseLike<{
      data: ProfileName[] | null;
      error: { message: string } | null;
    }>;
  };
};

/** public.activity_log — lecture seule, toujours filtrée par agence. */
export function activityLogTable() {
  return supabase.from("activity_log" as never) as unknown as ActivityQuery;
}

/** public.profiles — uniquement pour résoudre les noms d'auteurs. */
export function profileNamesTable() {
  return supabase.from("profiles" as never) as unknown as ProfileQuery;
}
