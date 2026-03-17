export interface LabelColorStyle {
  backgroundColor: string;
  color: string;
  borderColor: string;
}

export const COLOR_PALETTE = [
  "#84cc16",
  "#eab308",
  "#f97316",
  "#ef4444",
  "#ec4899",
  "#9333ea",
  "#2563eb",
  "#0ea5e9",
  "#14b8a6",
];

const hashLabelName = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const normalizeHex = (value?: string | null) => {
  if (!value) return null;
  const trimmed = value.trim().toLowerCase();
  if (/^#[0-9a-f]{3}$/.test(trimmed)) {
    const r = trimmed[1];
    const g = trimmed[2];
    const b = trimmed[3];
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  if (/^#[0-9a-f]{6}$/.test(trimmed)) {
    return trimmed;
  }
  return null;
};

const hexToRgb = (hex: string) => {
  const parsed = hex.replace("#", "");
  return {
    r: parseInt(parsed.slice(0, 2), 16),
    g: parseInt(parsed.slice(2, 4), 16),
    b: parseInt(parsed.slice(4, 6), 16),
  };
};

const relativeLuminance = (hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  const toLinear = (v: number) => {
    const srgb = v / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
  };
  const rL = toLinear(r);
  const gL = toLinear(g);
  const bL = toLinear(b);
  return 0.2126 * rL + 0.7152 * gL + 0.0722 * bL;
};

const darken = (hex: string, amount: number) => {
  const { r, g, b } = hexToRgb(hex);
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  const dr = clamp(Math.round(r * (1 - amount)));
  const dg = clamp(Math.round(g * (1 - amount)));
  const db = clamp(Math.round(b * (1 - amount)));
  return `#${dr.toString(16).padStart(2, "0")}${dg
    .toString(16)
    .padStart(2, "0")}${db.toString(16).padStart(2, "0")}`;
};

const buildFromHex = (hex: string): LabelColorStyle => {
  const luminance = relativeLuminance(hex);
  return {
    backgroundColor: hex,
    color: luminance > 0.6 ? "#0f172a" : "#f8fafc",
    borderColor: darken(hex, 0.18),
  };
};

export const getLabelColors = (name: string, color?: string | null): LabelColorStyle => {
  const normalizedColor = normalizeHex(color);
  if (normalizedColor && COLOR_PALETTE.includes(normalizedColor)) {
    return buildFromHex(normalizedColor);
  }

  const normalized = name.trim().toLowerCase();
  const index = hashLabelName(normalized) % COLOR_PALETTE.length;
  return buildFromHex(COLOR_PALETTE[index]);
};
