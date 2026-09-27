import type { ThemeId, FontId } from "./invitation-schema";

export type Ornament = "arabesque" | "floral" | "geometric" | "leaves" | "line" | "dunes";

export interface Theme {
  id: ThemeId;
  name: string;
  description: string;
  colors: {
    bg: string;
    surface: string;
    text: string;
    muted: string;
    accent: string;
    accentSoft: string;
    border: string;
    envelope: string;
    seal: string;
  };
  ornament: Ornament;
  headingFont: FontId;
  bodyFont: FontId;
  dark?: boolean;
}

export const THEMES: Record<ThemeId, Theme> = {
  "royal-gold": {
    id: "royal-gold",
    name: "ذهبي ملكي",
    description: "عاجي دافئ مع زخارف عربية ذهبية",
    colors: {
      bg: "#fbf7ef",
      surface: "#fffdf8",
      text: "#3b2f1e",
      muted: "#8a7456",
      accent: "#b08d57",
      accentSoft: "#efe3cc",
      border: "#e3d3b3",
      envelope: "#e9dcc3",
      seal: "#8c2f39",
    },
    ornament: "arabesque",
    headingFont: "aref-ruqaa",
    bodyFont: "amiri",
  },
  "blush-floral": {
    id: "blush-floral",
    name: "وردي ناعم",
    description: "ألوان وردية هادئة وزهور رقيقة",
    colors: {
      bg: "#fdf4f3",
      surface: "#fffafa",
      text: "#4a2c33",
      muted: "#9b6b74",
      accent: "#c9778a",
      accentSoft: "#f7dfe3",
      border: "#f0cfd5",
      envelope: "#f3d6da",
      seal: "#b85a6e",
    },
    ornament: "floral",
    headingFont: "el-messiri",
    bodyFont: "amiri",
  },
  "night-royal": {
    id: "night-royal",
    name: "ليلة ملكية",
    description: "كحلي عميق مع لمسات ذهبية متلألئة",
    colors: {
      bg: "#0f1a2c",
      surface: "#15233a",
      text: "#f3e9d2",
      muted: "#b9a987",
      accent: "#d4af6a",
      accentSoft: "#223352",
      border: "#2c4166",
      envelope: "#1c2d4a",
      seal: "#d4af6a",
    },
    ornament: "geometric",
    headingFont: "aref-ruqaa",
    bodyFont: "amiri",
    dark: true,
  },
  "olive-garden": {
    id: "olive-garden",
    name: "حديقة الزيتون",
    description: "أخضر مريمي طبيعي وأوراق زيتون",
    colors: {
      bg: "#f4f5ef",
      surface: "#fbfcf8",
      text: "#2f3a2c",
      muted: "#6f7d68",
      accent: "#7c8f64",
      accentSoft: "#e3e8d8",
      border: "#d3dbc4",
      envelope: "#dfe5d2",
      seal: "#5f7148",
    },
    ornament: "leaves",
    headingFont: "reem-kufi",
    bodyFont: "lateef",
  },
  "modern-minimal": {
    id: "modern-minimal",
    name: "عصري بسيط",
    description: "أبيض وأسود بخطوط نظيفة",
    colors: {
      bg: "#fafafa",
      surface: "#ffffff",
      text: "#1c1c1c",
      muted: "#6b6b6b",
      accent: "#1c1c1c",
      accentSoft: "#eeeeee",
      border: "#dedede",
      envelope: "#ececec",
      seal: "#1c1c1c",
    },
    ornament: "line",
    headingFont: "reem-kufi",
    bodyFont: "tajawal",
  },
  "desert-sand": {
    id: "desert-sand",
    name: "رمال الصحراء",
    description: "ألوان ترابية دافئة مستوحاة من الصحراء",
    colors: {
      bg: "#f6ede3",
      surface: "#fcf6ef",
      text: "#4b3222",
      muted: "#9a7658",
      accent: "#b5683c",
      accentSoft: "#f0dcc8",
      border: "#e6cdb2",
      envelope: "#ecd6bf",
      seal: "#8e4a26",
    },
    ornament: "dunes",
    headingFont: "el-messiri",
    bodyFont: "amiri",
  },
};

export const THEME_LIST = Object.values(THEMES);

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
}

function mix(hex: string, withHex: string, amount: number) {
  const a = hexToRgb(hex);
  const b = hexToRgb(withHex);
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * amount));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/** CSS custom properties for a theme, with an optional accent override. */
export function themeVars(themeId: ThemeId, accentOverride?: string): React.CSSProperties {
  const t = THEMES[themeId] ?? THEMES["royal-gold"];
  const accent = accentOverride || t.colors.accent;
  const accentSoft = accentOverride ? mix(accentOverride, t.colors.bg, t.dark ? 0.75 : 0.82) : t.colors.accentSoft;
  return {
    "--inv-bg": t.colors.bg,
    "--inv-surface": t.colors.surface,
    "--inv-text": t.colors.text,
    "--inv-muted": t.colors.muted,
    "--inv-accent": accent,
    "--inv-accent-soft": accentSoft,
    "--inv-border": t.colors.border,
    "--inv-envelope": t.colors.envelope,
    "--inv-seal": accentOverride && !t.dark ? accentOverride : t.colors.seal,
  } as React.CSSProperties;
}
