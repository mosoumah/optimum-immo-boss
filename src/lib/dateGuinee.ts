/**
 * Horloge de référence de l'application : la Guinée (Africa/Conakry).
 *
 * La Guinée est à GMT+0 toute l'année, sans heure d'été. Toute date ou heure
 * « maintenant / aujourd'hui » affichée ou calculée côté client doit donc
 * passer par ce module : le fuseau et l'horloge de l'appareil ne doivent
 * jamais influencer le jour courant, l'heure affichée ou les bornes de
 * requêtes (début de journée, semaine, mois).
 *
 * Conventions :
 * - Les colonnes DATE (`date`, `date_arrivee`, `date_depart`, ...) restent des
 *   chaînes `YYYY-MM-DD`, calculées avec le jour guinéen.
 * - Les colonnes TIMESTAMPTZ (`created_at`, `paid_at`, ...) sont des instants :
 *   on les affiche toujours formatées dans `Africa/Conakry`.
 */

export const GUINEA_TIME_ZONE = "Africa/Conakry";
const LOCALE = "fr-FR";

/** Valeur acceptée : Date, instant ISO (avec fuseau), ou date seule `YYYY-MM-DD`. */
export type DateInput = Date | string | number | null | undefined;

export interface GuineaDateParts {
  year: number;
  /** 1-12 */
  month: number;
  /** 1-31 */
  day: number;
  /** 0-23, heure guinéenne */
  hour: number;
  minute: number;
  second: number;
  /** 0 = dimanche … 6 = samedi */
  weekDay: number;
}

const pad2 = (value: number): string => String(value).padStart(2, "0");

/** Jours de la semaine, indexés comme `getDay()` (0 = dimanche). */
export const WEEKDAY_SHORT_FR = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"] as const;
export const WEEKDAY_LONG_FR = [
  "dimanche",
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
] as const;
export const MONTH_LONG_FR = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
] as const;

/* ------------------------------------------------------------------ */
/* Parsing                                                             */
/* ------------------------------------------------------------------ */

/**
 * `YYYY-MM-DD` → Date placée à midi UTC de ce jour. L'heure médiane évite
 * tout glissement de jour, quel que soit le fuseau de lecture.
 */
const parseDateOnly = (value: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return new Date(Date.UTC(year, month - 1, day, 12));
};

const toValidDate = (value: DateInput): Date | null => {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "number") {
    const fromNumber = new Date(value);
    return Number.isNaN(fromNumber.getTime()) ? null : fromNumber;
  }
  const trimmed = value.trim();
  if (!trimmed) return null;
  const dateOnly = parseDateOnly(trimmed);
  if (dateOnly) return dateOnly;
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

/** La valeur est-elle une colonne DATE (`YYYY-MM-DD`) plutôt qu'un instant ? */
const isDateOnlyValue = (value: DateInput): boolean =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.trim());

/* ------------------------------------------------------------------ */
/* Formatage (conversion vers l'heure guinéenne)                       */
/* ------------------------------------------------------------------ */

const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: GUINEA_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

/** Numéro de jour de la semaine (0 = dimanche) d'une date calendaire pure. */
const weekDayOfDateOnly = (year: number, month: number, day: number): number =>
  new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay();

/** Découpe une valeur dans le calendrier guinéen (fuseau Africa/Conakry). */
export const guineaParts = (value: DateInput = new Date()): GuineaDateParts | null => {
  const date = toValidDate(value);
  if (!date) return null;
  const chunks = partsFormatter.formatToParts(date);
  const pick = (type: Intl.DateTimeFormatPartTypes): number => {
    const found = chunks.find((chunk) => chunk.type === type);
    return found ? Number(found.value) : NaN;
  };
  const year = pick("year");
  const month = pick("month");
  const day = pick("day");
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  return {
    year,
    month,
    day,
    hour: pick("hour"),
    minute: pick("minute"),
    second: pick("second"),
    weekDay: weekDayOfDateOnly(year, month, day),
  };
};

/* ------------------------------------------------------------------ */
/* Date / heure actuelles en Guinée                                    */
/* ------------------------------------------------------------------ */

/** Jour courant en Guinée, au format `YYYY-MM-DD`. */
export const todayGN = (): string => {
  const parts = guineaParts(new Date());
  if (!parts) return "";
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
};

/** Mois courant en Guinée, au format `YYYY-MM`. */
export const currentMonthGN = (): string => todayGN().slice(0, 7);

/** Année courante en Guinée. */
export const currentYearGN = (): number => Number(todayGN().slice(0, 4));

/** Date et heure actuelles en Guinée : `YYYY-MM-DD`, `HH:MM` et les détails. */
export const nowGN = (): { date: string; time: string; parts: GuineaDateParts | null } => {
  const parts = guineaParts(new Date());
  if (!parts) return { date: "", time: "", parts: null };
  return {
    date: `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`,
    time: `${pad2(parts.hour)}:${pad2(parts.minute)}`,
    parts,
  };
};

/**
 * Instant ISO du minuit guinéen du jour courant (bornes `.gte("created_at", …)`).
 * La Guinée étant en GMT+0, le minuit local est directement `T00:00:00.000Z`.
 */
export const startOfTodayGN = (): string => {
  const today = todayGN();
  return today ? `${today}T00:00:00.000Z` : "";
};

/** Instant ISO du minuit guinéen d'un jour donné. */
export const startOfDayGN = (value: DateInput): string | null => {
  const dateOnly = toDateOnly(value);
  return dateOnly ? `${dateOnly}T00:00:00.000Z` : null;
};

/** Instant ISO de la fin (exclue) du jour guinéen d'une valeur donnée. */
export const endOfDayGN = (value: DateInput): string | null => {
  const dateOnly = toDateOnly(value);
  if (!dateOnly) return null;
  return `${addDaysGN(dateOnly, 1)}T00:00:00.000Z`;
};

/* ------------------------------------------------------------------ */
/* Affichage                                                           */
/* ------------------------------------------------------------------ */

const timeFormatter = new Intl.DateTimeFormat(LOCALE, {
  timeZone: GUINEA_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  timeZone: GUINEA_TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE, {
  timeZone: GUINEA_TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const dateLongFormatter = new Intl.DateTimeFormat(LOCALE, {
  timeZone: GUINEA_TIME_ZONE,
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** `HH:MM` en heure guinéenne (chaîne vide si la valeur est invalide). */
export const formatTimeGN = (value: DateInput): string => {
  const date = toValidDate(value);
  return date ? timeFormatter.format(date) : "";
};

/** `JJ/MM/AAAA` en heure guinéenne (chaîne vide si la valeur est invalide). */
export const formatDateGN = (value: DateInput): string => {
  const date = toValidDate(value);
  return date ? dateFormatter.format(date) : "";
};

/** `JJ/MM/AAAA HH:MM` en heure guinéenne (chaîne vide si invalide). */
export const formatDateTimeGN = (value: DateInput): string => {
  const date = toValidDate(value);
  return date ? dateTimeFormatter.format(date) : "";
};

/** `14 février 2026` en heure guinéenne (chaîne vide si invalide). */
export const formatDateLongGN = (value: DateInput): string => {
  const date = toValidDate(value);
  return date ? dateLongFormatter.format(date) : "";
};

const dayMonthFormatter = new Intl.DateTimeFormat(LOCALE, {
  timeZone: GUINEA_TIME_ZONE,
  day: "2-digit",
  month: "short",
});

/** `14 févr.` en heure guinéenne (chaîne vide si invalide). */
export const formatDayMonthGN = (value: DateInput): string => {
  const date = toValidDate(value);
  return date ? dayMonthFormatter.format(date) : "";
};

/** Heure guinéenne (0-23) d'un instant, `null` si la valeur est invalide. */
export const hourGN = (value: DateInput): number | null => {
  const parts = guineaParts(value);
  return parts ? parts.hour : null;
};

/* ------------------------------------------------------------------ */
/* Date seule (`YYYY-MM-DD`) et arithmétique calendaire                */
/* ------------------------------------------------------------------ */

/** Jour guinéen d'une valeur, au format `YYYY-MM-DD`. */
export const toDateOnly = (value: DateInput): string | null => {
  if (value === null || value === undefined || value === "") return null;
  if (isDateOnlyValue(value)) {
    const parsed = parseDateOnly(value as string);
    if (!parsed) return null;
    return (value as string).trim();
  }
  const parts = guineaParts(value);
  if (!parts) return null;
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
};

/**
 * Date « calendrier » du picker pour un jour guinéen : minuit local du même
 * jour. Un `<Calendar>` (react-day-picker) raisonne en heure locale, on lui
 * donne donc la même année / mois / jour que le jour guinéen, sans conversion.
 */
export const toPickerDate = (value: DateInput): Date | null => {
  const dateOnly = toDateOnly(value);
  if (!dateOnly) return null;
  const [year, month, day] = dateOnly.split("-").map(Number);
  return new Date(year, month - 1, day);
};

/** Valeur par défaut d'un formulaire : aujourd'hui en Guinée, pour le picker. */
export const todayPickerDate = (): Date => {
  const [year, month, day] = todayGN().split("-").map(Number);
  return new Date(year, month - 1, day);
};

/** Date d'un picker → `YYYY-MM-DD` (jour tel que vu par l'utilisateur). */
export const pickerDateToDateOnly = (date: Date | null | undefined): string => {
  if (!date || Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
};

/** Ajoute (ou retire) des jours à un jour `YYYY-MM-DD`. */
export const addDaysGN = (dateOnly: string, days: number): string => {
  const [year, month, day] = dateOnly.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day, 12));
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return `${shifted.getUTCFullYear()}-${pad2(shifted.getUTCMonth() + 1)}-${pad2(shifted.getUTCDate())}`;
};

/** Nombre de jours entre deux jours `YYYY-MM-DD` (b - a). */
export const diffDaysGN = (from: string, to: string): number => {
  const [ay, am, ad] = from.split("-").map(Number);
  const [by, bm, bd] = to.split("-").map(Number);
  const a = Date.UTC(ay, am - 1, ad);
  const b = Date.UTC(by, bm - 1, bd);
  return Math.round((b - a) / 86_400_000);
};

/** Lundi du jour guinéen (ou du jour donné), au format `YYYY-MM-DD`. */
export const startOfWeekGN = (value: DateInput = new Date()): string => {
  const dateOnly = toDateOnly(value) ?? todayGN();
  const parts = guineaParts(dateOnly);
  const weekDay = parts ? parts.weekDay : 0;
  const offset = (weekDay + 6) % 7; // lundi = 0
  return addDaysGN(dateOnly, -offset);
};

/** Bornes du mois guinéen : premier et dernier jour (`YYYY-MM-DD`). */
export const monthBoundsGN = (
  value: DateInput = new Date(),
): { month: string; start: string; end: string } => {
  const dateOnly = toDateOnly(value) ?? todayGN();
  const [year, month] = dateOnly.split("-").map(Number);
  const start = `${year}-${pad2(month)}-01`;
  return { month: `${year}-${pad2(month)}`, start, end: addDaysGN(`${year}-${pad2(month + 1)}-01`, -1) };
};

/** Nombre de jours du mois guinéen d'une valeur. */
export const daysInMonthGN = (value: DateInput = new Date()): number => {
  const { start } = monthBoundsGN(value);
  const [year, month] = start.split("-").map(Number);
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
};

/* ------------------------------------------------------------------ */
/* Comparaisons de jours                                               */
/* ------------------------------------------------------------------ */

/** La valeur tombe-t-elle le jour guinéen courant ? */
export const isTodayGN = (value: DateInput): boolean => {
  const dateOnly = toDateOnly(value);
  return dateOnly !== null && dateOnly === todayGN();
};

/** La valeur tombe-t-elle dans la semaine guinéenne courante (lundi → dimanche) ? */
export const isThisWeekGN = (value: DateInput): boolean => {
  const dateOnly = toDateOnly(value);
  if (!dateOnly) return false;
  const start = startOfWeekGN();
  return dateOnly >= start && dateOnly <= addDaysGN(start, 6);
};

/** La valeur tombe-t-elle dans le mois guinéen courant ? */
export const isThisMonthGN = (value: DateInput): boolean => {
  const dateOnly = toDateOnly(value);
  return dateOnly !== null && dateOnly.slice(0, 7) === currentMonthGN();
};

/** Jour du mois d'un jour guinéen, sans zéro initial (`"05"` donne `"5"`); `null` si invalide. */
export const dayOfMonthGN = (value: DateInput): string | null => {
  const dateOnly = toDateOnly(value);
  if (!dateOnly) return null;
  return String(Number(dateOnly.slice(8, 10)));
};

/** Index du jour de la semaine d'un jour guinéen (0 = dimanche). */
export const weekDayGN = (value: DateInput): number => {
  const dateOnly = toDateOnly(value);
  if (!dateOnly) return 0;
  const [year, month, day] = dateOnly.split("-").map(Number);
  return weekDayOfDateOnly(year, month, day);
};

/** Libellé court du jour (`Lun`, `Mar`, …) d'un jour guinéen. */
export const weekDayShortGN = (value: DateInput): string => WEEKDAY_SHORT_FR[weekDayGN(value)];
