/**
 * Compression d'image dans le navigateur, avant l'envoi vers Supabase Storage.
 *
 * Objectif : ne plus téléverser des photos de plusieurs mégaoctets. Le fichier
 * est redimensionné (côté maximum) puis ré-encodé — WebP par défaut, PNG quand
 * la transparence doit être conservée (signature).
 *
 * Aucun effet de bord : si le navigateur ne sait pas encoder le format demandé,
 * le fichier d'origine est renvoyé tel quel.
 */

export interface OptimizeImageOptions {
  /** Côté maximum en pixels (le ratio est conservé). */
  maxSide: number;
  /** Qualité d'encodage 0-1 (ignorée en PNG). */
  quality?: number;
  /** Format de sortie. `image/png` garde la transparence. */
  mimeType?: "image/webp" | "image/png";
}

const EXTENSION: Record<string, string> = {
  "image/webp": "webp",
  "image/png": "png",
  "image/jpeg": "jpg",
};

const loadBitmap = async (file: File): Promise<ImageBitmap | HTMLImageElement> => {
  if (typeof createImageBitmap === "function") {
    return createImageBitmap(file);
  }
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Image illisible"));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
};

const replaceExtension = (name: string, extension: string): string => {
  const base = name.includes(".") ? name.slice(0, name.lastIndexOf(".")) : name;
  return `${base}.${extension}`;
};

/**
 * Renvoie un fichier optimisé (nom, type et taille cohérents avec le contenu).
 * En cas d'échec de décodage/encodage, renvoie le fichier d'origine.
 */
export const optimizeImageFile = async (
  file: File,
  { maxSide, quality = 0.8, mimeType = "image/webp" }: OptimizeImageOptions,
): Promise<File> => {
  if (!file.type.startsWith("image/")) return file;

  try {
    const source = await loadBitmap(file);
    const width = "width" in source ? source.width : 0;
    const height = "height" in source ? source.height : 0;
    if (!width || !height) return file;

    const scale = Math.min(1, maxSide / Math.max(width, height));
    const targetWidth = Math.max(1, Math.round(width * scale));
    const targetHeight = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source as CanvasImageSource, 0, 0, targetWidth, targetHeight);
    if ("close" in source && typeof source.close === "function") source.close();

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((result) => resolve(result), mimeType, quality);
    });
    if (!blob) return file;

    // Un fichier déjà petit ne doit pas grossir : on garde l'original.
    if (blob.size >= file.size) return file;

    return new File([blob], replaceExtension(file.name, EXTENSION[blob.type] ?? "webp"), {
      type: blob.type || mimeType,
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
};

/** Photo de bien : 1600 px de côté maximum, WebP qualité 0,8. */
export const optimizePropertyPhoto = (file: File) =>
  optimizeImageFile(file, { maxSide: 1600, quality: 0.8, mimeType: "image/webp" });

/** Logo : 600 px maximum, WebP qualité 0,8. */
export const optimizeLogo = (file: File) =>
  optimizeImageFile(file, { maxSide: 600, quality: 0.8, mimeType: "image/webp" });

/** Signature : 600 px maximum, PNG pour conserver la transparence. */
export const optimizeSignature = (file: File) =>
  optimizeImageFile(file, { maxSide: 600, mimeType: "image/png" });
