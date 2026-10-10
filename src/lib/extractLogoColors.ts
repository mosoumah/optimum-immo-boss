// [UTIL] Extraction locale des couleurs d'un logo (navigateur, sans IA).
export interface LogoColors {
  couleur_primaire: string;
  couleur_secondaire: string;
  couleur_accent: string;
}

// Palette par défaut d'Optimum Immo (inchangée)
export const DEFAULT_LOGO_COLORS: LogoColors = {
  couleur_primaire: "#E97451",
  couleur_secondaire: "#FFF5F2",
  couleur_accent: "#1a1a2e",
};

const toHex = (r: number, g: number, b: number) =>
  "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");

const mix = (c: [number, number, number], target: [number, number, number], ratio: number): [number, number, number] => [
  c[0] + (target[0] - c[0]) * ratio,
  c[1] + (target[1] - c[1]) * ratio,
  c[2] + (target[2] - c[2]) * ratio,
];

const loadImage = (source: File | string): Promise<{ img: HTMLImageElement; revoke?: () => void }> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    let objectUrl: string | undefined;
    if (typeof source === "string") {
      img.crossOrigin = "anonymous";
      img.src = source;
    } else {
      objectUrl = URL.createObjectURL(source);
      img.src = objectUrl;
    }
    img.onload = () => resolve({ img, revoke: objectUrl ? () => URL.revokeObjectURL(objectUrl!) : undefined });
    img.onerror = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      reject(new Error("Impossible de charger le logo"));
    };
  });

export async function extractLogoColors(source: File | string): Promise<LogoColors> {
  const { img, revoke } = await loadImage(source);
  try {
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return DEFAULT_LOGO_COLORS;

    const scale = Math.min(size / img.naturalWidth, size / img.naturalHeight, 1);
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    ctx.drawImage(img, 0, 0, w, h);
    const { data } = ctx.getImageData(0, 0, w, h);

    // Quantification (32 niveaux par canal) en ignorant transparent / blanc / noir / gris
    const buckets = new Map<number, { n: number; r: number; g: number; b: number }>();
    for (let i = 0; i < data.length; i += 4) {
      const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
      if (a < 128) continue;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      if (max > 240 && min > 225) continue; // quasi blanc
      if (max < 25) continue; // quasi noir
      if (max - min < 24) continue; // gris
      const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
      const e = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
      e.n++; e.r += r; e.g += g; e.b += b;
      buckets.set(key, e);
    }

    let best: { n: number; r: number; g: number; b: number } | null = null;
    for (const e of buckets.values()) if (!best || e.n > best.n) best = e;
    if (!best) return DEFAULT_LOGO_COLORS;

    const primary: [number, number, number] = [best.r / best.n, best.g / best.n, best.b / best.n];
    const secondary = mix(primary, [255, 255, 255], 0.92); // teinte très claire pour les fonds
    const accent = mix(primary, [10, 10, 30], 0.82); // version très sombre pour le texte

    return {
      couleur_primaire: toHex(...primary),
      couleur_secondaire: toHex(...secondary),
      couleur_accent: toHex(...accent),
    };
  } finally {
    revoke?.();
  }
}
