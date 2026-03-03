/**
 * Escapes HTML special characters to prevent XSS attacks.
 * Use this function when injecting user data into HTML strings.
 */
export const escapeHtml = (str: string | null | undefined): string => {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Validates and sanitizes a hex color string.
 * Returns the color if valid, or a fallback color otherwise.
 */
export const sanitizeHexColor = (color: string | null | undefined, fallback: string): string => {
  if (!color) return fallback;
  const hexRegex = /^#[0-9A-Fa-f]{3,6}$/;
  return hexRegex.test(color.trim()) ? color.trim() : fallback;
};
