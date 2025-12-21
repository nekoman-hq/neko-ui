/**
 * Converts various color formats to RGB values
 * @param color - Color code in various formats
 * @returns RGB values as string "r g b" or null if invalid format
 */
function convertToRGB(color: string): string | null {
  if (!color || typeof color !== "string") return null;

  const trimmed = color.trim();

  // HEX Format: #RGB oder #RRGGBB
  if (trimmed.startsWith("#")) {
    const hex = trimmed.slice(1);

    // 3-stelliges Hex (#RGB)
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);

      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
        return `${r} ${g} ${b}`;
      }
    }

    // 6-stelliges Hex (#RRGGBB)
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);

      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
        return `${r} ${g} ${b}`;
      }
    }

    return null;
  }

  // RGB Format: rgb(r, g, b) oder rgb(r,g,b)
  const rgbMatch = trimmed.match(
    /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i,
  );
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]);
    const g = parseInt(rgbMatch[2]);
    const b = parseInt(rgbMatch[3]);

    if (r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
      return `${r} ${g} ${b}`;
    }
    return null;
  }

  // RGBA Format: rgba(r, g, b, a) - Alpha-Wert wird ignoriert
  const rgbaMatch = trimmed.match(
    /^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*[\d.]+\s*\)$/i,
  );
  if (rgbaMatch) {
    const r = parseInt(rgbaMatch[1]);
    const g = parseInt(rgbaMatch[2]);
    const b = parseInt(rgbaMatch[3]);

    if (r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
      return `${r} ${g} ${b}`;
    }
    return null;
  }

  // HSL Format: hsl(h, s%, l%)
  const hslMatch = trimmed.match(
    /^hsl\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)$/i,
  );
  if (hslMatch) {
    const h = parseInt(hslMatch[1]);
    const s = parseInt(hslMatch[2]) / 100;
    const l = parseInt(hslMatch[3]) / 100;

    const rgb = hslToRgb(h, s, l);
    if (rgb) return `${rgb.r} ${rgb.g} ${rgb.b}`;
  }

  // Named colors (most common)
  const namedColors: Record<string, string> = {
    black: "0 0 0",
    white: "255 255 255",
    red: "255 0 0",
    green: "0 128 0",
    blue: "0 0 255",
    yellow: "255 255 0",
    cyan: "0 255 255",
    magenta: "255 0 255",
    silver: "192 192 192",
    gray: "128 128 128",
    grey: "128 128 128",
    maroon: "128 0 0",
    olive: "128 128 0",
    lime: "0 255 0",
    aqua: "0 255 255",
    teal: "0 128 128",
    navy: "0 0 128",
    fuchsia: "255 0 255",
    purple: "128 0 128",
    orange: "255 165 0",
  };

  const lower = trimmed.toLowerCase();
  if (lower in namedColors) {
    return namedColors[lower];
  }

  return null;
}

/**
 * Helper function: Converts HSL to RGB
 */
function hslToRgb(
  h: number,
  s: number,
  l: number,
): { r: number; g: number; b: number } | null {
  if (h < 0 || h > 360 || s < 0 || s > 1 || l < 0 || l > 1) return null;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0,
    g = 0,
    b = 0;

  if (h >= 0 && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h >= 60 && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h >= 180 && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h >= 240 && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (h >= 300 && h < 360) {
    r = c;
    g = 0;
    b = x;
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

export { convertToRGB };
