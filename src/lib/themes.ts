import type { ColorKey, FontId, InvitationStyle, OrnamentId, PatternId, ThemeId } from "./invitation-schema";

export type Ornament = OrnamentId;
export type Radius = "sharp" | "soft" | "round";
export type Frame = "none" | "single" | "double";
export type CoverShape = "arch" | "circle" | "rounded" | "square";
export type Particle = "petals" | "hearts" | "stars" | "sparkles";

export interface Theme {
  id: ThemeId;
  name: string;
  description: string;
  colors: Record<ColorKey, string>;
  ornament: Ornament;
  pattern: PatternId;
  radius: Radius;
  frame: Frame;
  coverShape: CoverShape;
  particle: Particle;
  headingFont: FontId;
  bodyFont: FontId;
  dark?: boolean;
}

const t = (theme: Theme) => theme;

export const THEMES: Record<ThemeId, Theme> = {
  "royal-gold": t({
    id: "royal-gold",
    name: "ذهبي ملكي",
    description: "عاجي دافئ مع زخارف عربية ذهبية",
    colors: { bg: "#fbf7ef", surface: "#fffdf8", text: "#3b2f1e", muted: "#8a7456", accent: "#b08d57", border: "#e3d3b3", envelope: "#e9dcc3", seal: "#8c2f39" },
    ornament: "arabesque",
    pattern: "geometric",
    radius: "round",
    frame: "none",
    coverShape: "arch",
    particle: "petals",
    headingFont: "aref-ruqaa",
    bodyFont: "amiri",
  }),
  "blush-floral": t({
    id: "blush-floral",
    name: "وردي ناعم",
    description: "ألوان وردية هادئة وزهور رقيقة",
    colors: { bg: "#fdf4f3", surface: "#fffafa", text: "#4a2c33", muted: "#9b6b74", accent: "#c9778a", border: "#f0cfd5", envelope: "#f3d6da", seal: "#b85a6e" },
    ornament: "floral",
    pattern: "floral",
    radius: "round",
    frame: "none",
    coverShape: "circle",
    particle: "petals",
    headingFont: "el-messiri",
    bodyFont: "amiri",
  }),
  "night-royal": t({
    id: "night-royal",
    name: "ليلة ملكية",
    description: "كحلي عميق مع لمسات ذهبية متلألئة",
    colors: { bg: "#0f1a2c", surface: "#15233a", text: "#f3e9d2", muted: "#b9a987", accent: "#d4af6a", border: "#2c4166", envelope: "#1c2d4a", seal: "#d4af6a" },
    ornament: "geometric",
    pattern: "geometric",
    radius: "soft",
    frame: "double",
    coverShape: "arch",
    particle: "sparkles",
    headingFont: "aref-ruqaa",
    bodyFont: "amiri",
    dark: true,
  }),
  "olive-garden": t({
    id: "olive-garden",
    name: "حديقة الزيتون",
    description: "أخضر مريمي طبيعي وأوراق زيتون",
    colors: { bg: "#f4f5ef", surface: "#fbfcf8", text: "#2f3a2c", muted: "#6f7d68", accent: "#7c8f64", border: "#d3dbc4", envelope: "#dfe5d2", seal: "#5f7148" },
    ornament: "leaves",
    pattern: "floral",
    radius: "round",
    frame: "none",
    coverShape: "arch",
    particle: "petals",
    headingFont: "reem-kufi",
    bodyFont: "lateef",
  }),
  "modern-minimal": t({
    id: "modern-minimal",
    name: "عصري بسيط",
    description: "أبيض وأسود بخطوط نظيفة",
    colors: { bg: "#fafafa", surface: "#ffffff", text: "#1c1c1c", muted: "#6b6b6b", accent: "#1c1c1c", border: "#dedede", envelope: "#ececec", seal: "#1c1c1c" },
    ornament: "line",
    pattern: "none",
    radius: "sharp",
    frame: "single",
    coverShape: "square",
    particle: "sparkles",
    headingFont: "reem-kufi",
    bodyFont: "tajawal",
  }),
  "desert-sand": t({
    id: "desert-sand",
    name: "رمال الصحراء",
    description: "ألوان ترابية دافئة مستوحاة من الصحراء",
    colors: { bg: "#f6ede3", surface: "#fcf6ef", text: "#4b3222", muted: "#9a7658", accent: "#b5683c", border: "#e6cdb2", envelope: "#ecd6bf", seal: "#8e4a26" },
    ornament: "dunes",
    pattern: "dots",
    radius: "round",
    frame: "none",
    coverShape: "arch",
    particle: "petals",
    headingFont: "el-messiri",
    bodyFont: "amiri",
  }),
  "emerald-palace": t({
    id: "emerald-palace",
    name: "قصر الزمرد",
    description: "أخضر زمردي فاخر مع نجوم ذهبية",
    colors: { bg: "#0d2b24", surface: "#123a31", text: "#f1e8cf", muted: "#b7c2a8", accent: "#d6b36a", border: "#23574a", envelope: "#184a3e", seal: "#d6b36a" },
    ornament: "stars",
    pattern: "stars",
    radius: "soft",
    frame: "double",
    coverShape: "arch",
    particle: "stars",
    headingFont: "aref-ruqaa",
    bodyFont: "scheherazade",
    dark: true,
  }),
  "burgundy-velvet": t({
    id: "burgundy-velvet",
    name: "مخمل عنابي",
    description: "عنابي دافئ وذهبي بطابع كلاسيكي",
    colors: { bg: "#3a0f19", surface: "#4a1522", text: "#f7e7d4", muted: "#d4ab9b", accent: "#e0b872", border: "#6b2433", envelope: "#5a1a28", seal: "#e0b872" },
    ornament: "arabesque",
    pattern: "arabesque",
    radius: "soft",
    frame: "single",
    coverShape: "arch",
    particle: "petals",
    headingFont: "aref-ruqaa",
    bodyFont: "amiri",
    dark: true,
  }),
  "lavender-dream": t({
    id: "lavender-dream",
    name: "حلم الخزامى",
    description: "بنفسجي فاتح هادئ وزهور ناعمة",
    colors: { bg: "#f6f3fb", surface: "#fdfcff", text: "#3a2f4d", muted: "#857a9c", accent: "#8e74b8", border: "#e1d8f0", envelope: "#e7dff3", seal: "#6f559b" },
    ornament: "floral",
    pattern: "floral",
    radius: "round",
    frame: "none",
    coverShape: "circle",
    particle: "petals",
    headingFont: "mirza",
    bodyFont: "lateef",
  }),
  "andalusian-turquoise": t({
    id: "andalusian-turquoise",
    name: "فيروز أندلسي",
    description: "فيروزي وأبيض مستوحى من بلاط الأندلس",
    colors: { bg: "#f2f8f8", surface: "#ffffff", text: "#163c44", muted: "#5b8189", accent: "#1f8a8a", border: "#c8e2e2", envelope: "#d6ecec", seal: "#b8862f" },
    ornament: "geometric",
    pattern: "lattice",
    radius: "soft",
    frame: "double",
    coverShape: "arch",
    particle: "stars",
    headingFont: "reem-kufi",
    bodyFont: "scheherazade",
  }),
  "rose-gold": t({
    id: "rose-gold",
    name: "ذهبي وردي",
    description: "لمسات الذهب الوردي على خلفية ناصعة",
    colors: { bg: "#fbf6f4", surface: "#ffffff", text: "#4b3530", muted: "#a07f76", accent: "#b76e79", border: "#efdcd6", envelope: "#f2e1dc", seal: "#b76e79" },
    ornament: "line",
    pattern: "dots",
    radius: "round",
    frame: "single",
    coverShape: "rounded",
    particle: "hearts",
    headingFont: "el-messiri",
    bodyFont: "tajawal",
  }),
  "black-gold": t({
    id: "black-gold",
    name: "أسود وذهبي",
    description: "فخامة الأسود مع بريق الذهب",
    colors: { bg: "#0b0b0b", surface: "#151515", text: "#f2e6c9", muted: "#a89b7c", accent: "#c9a45c", border: "#2e2a22", envelope: "#1c1a16", seal: "#c9a45c" },
    ornament: "stars",
    pattern: "geometric",
    radius: "sharp",
    frame: "double",
    coverShape: "square",
    particle: "sparkles",
    headingFont: "rakkas",
    bodyFont: "amiri",
    dark: true,
  }),
  "pearl-blue": t({
    id: "pearl-blue",
    name: "لؤلؤي أزرق",
    description: "أبيض لؤلؤي وأزرق هادئ",
    colors: { bg: "#f5f7fa", surface: "#ffffff", text: "#23324a", muted: "#6d7c93", accent: "#5b7fa8", border: "#d9e2ee", envelope: "#e2e9f2", seal: "#3f5f86" },
    ornament: "leaves",
    pattern: "dots",
    radius: "round",
    frame: "none",
    coverShape: "circle",
    particle: "sparkles",
    headingFont: "el-messiri",
    bodyFont: "almarai",
  }),
  "damascene-rose": t({
    id: "damascene-rose",
    name: "الوردة الدمشقية",
    description: "بيج دافئ ووردي دمشقي مع أرابيسك",
    colors: { bg: "#f8f0ea", surface: "#fffaf6", text: "#4a2a2a", muted: "#9c7068", accent: "#a8445a", border: "#ecd3c9", envelope: "#efdcd2", seal: "#7d2b3f" },
    ornament: "arabesque",
    pattern: "arabesque",
    radius: "round",
    frame: "single",
    coverShape: "arch",
    particle: "petals",
    headingFont: "aref-ruqaa",
    bodyFont: "amiri",
  }),
  "moroccan-terracotta": t({
    id: "moroccan-terracotta",
    name: "تراكوتا مغربي",
    description: "طين أحمر وأخضر زيتي بنجوم مغربية",
    colors: { bg: "#f7ebe0", surface: "#fdf6ef", text: "#4a2618", muted: "#8f6450", accent: "#c05a35", border: "#e8cbb4", envelope: "#ecd3be", seal: "#2f6b5e" },
    ornament: "stars",
    pattern: "stars",
    radius: "soft",
    frame: "double",
    coverShape: "arch",
    particle: "stars",
    headingFont: "changa",
    bodyFont: "scheherazade",
  }),
};

export const THEME_LIST = Object.values(THEMES);

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
}

export function mix(hex: string, withHex: string, amount: number) {
  const a = hexToRgb(hex);
  const b = hexToRgb(withHex);
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * amount));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

export function isDark(hex: string) {
  const [r, g, b] = hexToRgb(hex);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

export interface ResolvedStyle {
  theme: Theme;
  colors: Record<ColorKey, string> & { accentSoft: string };
  ornament: Ornament;
  pattern: PatternId;
  radius: Radius;
  frame: Frame;
  coverShape: CoverShape;
  particle: Particle;
  dark: boolean;
}

/** Merges the selected theme with the invitation's per-field overrides. */
export function resolveStyle(style: Pick<InvitationStyle, "theme" | "accent"> & Partial<InvitationStyle>): ResolvedStyle {
  const theme = THEMES[style.theme] ?? THEMES["royal-gold"];
  const o = style.colors ?? {};
  const pick = (k: ColorKey) => o[k] || theme.colors[k];
  const colors = {
    bg: pick("bg"),
    surface: pick("surface"),
    text: pick("text"),
    muted: pick("muted"),
    accent: o.accent || style.accent || theme.colors.accent,
    border: pick("border"),
    envelope: pick("envelope"),
    seal: pick("seal"),
  };
  const dark = isDark(colors.bg);
  return {
    theme,
    colors: { ...colors, accentSoft: mix(colors.accent, colors.bg, dark ? 0.75 : 0.82) },
    ornament: style.ornament || theme.ornament,
    pattern: style.pattern || theme.pattern,
    radius: style.radius || theme.radius,
    frame: style.frame || theme.frame,
    coverShape: style.coverShape || theme.coverShape,
    particle: style.particle || theme.particle,
    dark,
  };
}

const RADIUS_VARS: Record<Radius, [string, string, string]> = {
  sharp: ["0.25rem", "0.2rem", "0.35rem"],
  soft: ["0.9rem", "0.6rem", "0.75rem"],
  round: ["1.5rem", "1rem", "9999px"],
};

/** CSS custom properties consumed by the invitation styles. */
export function styleVars(r: ResolvedStyle): React.CSSProperties {
  const [radius, radiusSm, btn] = RADIUS_VARS[r.radius];
  return {
    "--inv-bg": r.colors.bg,
    "--inv-surface": r.colors.surface,
    "--inv-text": r.colors.text,
    "--inv-muted": r.colors.muted,
    "--inv-accent": r.colors.accent,
    "--inv-accent-soft": r.colors.accentSoft,
    "--inv-border": r.colors.border,
    "--inv-envelope": r.colors.envelope,
    "--inv-seal": r.colors.seal,
    "--inv-radius": radius,
    "--inv-radius-sm": radiusSm,
    "--inv-btn-radius": btn,
  } as React.CSSProperties;
}
