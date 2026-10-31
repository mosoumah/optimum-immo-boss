import type { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";

/**
 * Accès typé à `entreprises.heure_depart_standard`.
 *
 * La colonne existe en base (`time`, défaut 12:00) mais pas encore dans
 * `src/integrations/supabase/types.ts` (fichier généré, volontairement non
 * régénéré). On isole donc ici un cast local et documenté — aucun `any`.
 */

export type EntrepriseRow = Database["public"]["Tables"]["entreprises"]["Row"];
export type EntrepriseUpdate = Database["public"]["Tables"]["entreprises"]["Update"];

/** Ligne `entreprises` augmentée de la colonne non générée. */
export interface EntrepriseSettingsRow extends EntrepriseRow {
  heure_depart_standard: string | null;
}

/** Valeur envoyée en écriture : colonnes générées + heure standard. */
export type EntrepriseSettingsUpdate = EntrepriseUpdate & {
  heure_depart_standard?: string | null;
};

interface EntrepriseSelectQuery {
  select: (columns: string) => {
    eq: (
      column: "id",
      value: string,
    ) => {
      maybeSingle: () => Promise<{
        data: EntrepriseSettingsRow | null;
        error: { message: string } | null;
      }>;
    };
  };
}

interface EntrepriseUpdateQuery {
  update: (values: EntrepriseSettingsUpdate) => {
    eq: (column: "id", value: string) => Promise<{ error: { message: string } | null }>;
  };
}

/**
 * Lecture de l'entreprise avec la colonne non générée.
 * Le type renvoyé décrit la ligne complète : ne lire que les colonnes
 * réellement demandées dans le `select`.
 */
export const entrepriseSettingsTable = () =>
  supabase.from("entreprises") as unknown as EntrepriseSelectQuery;

/** Écriture de l'entreprise avec la colonne non générée. */
export const entrepriseSettingsUpdate = () =>
  supabase.from("entreprises") as unknown as EntrepriseUpdateQuery;

/** "12:00" | "12:00:00" | null -> "12:00" (valeur par défaut de la base). */
export const HEURE_DEPART_STANDARD_DEFAUT = "12:00";

export const toHeureInput = (value: string | null | undefined): string => {
  if (!value) return HEURE_DEPART_STANDARD_DEFAUT;
  const match = /^(\d{1,2}):(\d{2})/.exec(value.trim());
  if (!match) return HEURE_DEPART_STANDARD_DEFAUT;
  const heures = Number(match[1]);
  if (heures < 0 || heures > 23) return HEURE_DEPART_STANDARD_DEFAUT;
  return `${String(heures).padStart(2, "0")}:${match[2]}`;
};

/** "12:00" -> "12h00" (affichage lisible). */
export const formatHeureLabel = (value: string | null | undefined): string =>
  toHeureInput(value).replace(":", "h");

/** Valide strictement une saisie HH:MM (00-23 : 00-59). */
export const isValidHeureInput = (value: string): boolean =>
  /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
