import {
  ANIMATIONS,
  CARD_STYLES,
  COUNTDOWN_STYLES,
  COVER_SHAPES,
  DATE_STYLES,
  FRAMES,
  HERO_LAYOUTS,
  ORNAMENTS,
  PARTICLES,
  PATTERNS,
  RADII,
  THEME_IDS,
  type ColorKey,
  type FontId,
  type InvitationStyle,
} from "./invitation-schema";
import { THEMES } from "./themes";

function hexToHsl(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s * 100, l * 100];
}

function hsl(h: number, s: number, l: number) {
  const sat = Math.max(0, Math.min(100, s)) / 100;
  const lig = Math.max(0, Math.min(100, l)) / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sat * Math.min(lig, 1 - lig);
  const f = (n: number) => lig - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return `#${[f(0), f(8), f(4)].map((x) => Math.round(x * 255).toString(16).padStart(2, "0")).join("")}`;
}

/** Builds a harmonious 8-color palette around a single accent color. */
export function generatePalette(accent: string, mode: "light" | "dark"): Record<ColorKey, string> {
  const [h, s] = hexToHsl(accent);
  const sat = Math.max(s, 18);
  if (mode === "dark") {
    return {
      bg: hsl(h, sat * 0.45, 10),
      surface: hsl(h, sat * 0.4, 14),
      text: hsl(h, sat * 0.35, 92),
      muted: hsl(h, sat * 0.25, 70),
      accent,
      border: hsl(h, sat * 0.35, 24),
      envelope: hsl(h, sat * 0.4, 18),
      seal: accent,
    };
  }
  return {
    bg: hsl(h, sat * 0.4, 97),
    surface: hsl(h, sat * 0.3, 99.5),
    text: hsl(h, sat * 0.4, 17),
    muted: hsl(h, sat * 0.25, 42),
    accent,
    border: hsl(h, sat * 0.35, 86),
    envelope: hsl(h, sat * 0.35, 89),
    seal: hsl(h, Math.min(100, sat * 1.1), 32),
  };
}

/** Curated heading/body pairings that read well together. */
const FONT_PAIRS: [FontId, FontId][] = [
  ["aref-ruqaa", "amiri"],
  ["el-messiri", "amiri"],
  ["reem-kufi", "lateef"],
  ["reem-kufi", "tajawal"],
  ["mirza", "lateef"],
  ["rakkas", "amiri"],
  ["changa", "scheherazade"],
  ["noto-kufi", "almarai"],
  ["aref-ruqaa", "scheherazade"],
  ["el-messiri", "almarai"],
];

const pick = <T,>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)];

/**
 * A random but coherent design: a theme's palette (or a generated one), plus a
 * random combination of layout, ornament and typography choices.
 */
export function randomDesign(prev: InvitationStyle): InvitationStyle {
  const theme = THEMES[pick(THEME_IDS)];
  const [headingFont, bodyFont] = pick(FONT_PAIRS);
  const useGenerated = Math.random() < 0.35;
  const hue = Math.floor(Math.random() * 360);
  const colors = useGenerated ? generatePalette(hsl(hue, 45 + Math.random() * 25, 45), Math.random() < 0.3 ? "dark" : "light") : {};
  return {
    ...prev,
    theme: theme.id,
    accent: "",
    colors,
    headingFont,
    bodyFont,
    ornament: pick(ORNAMENTS),
    pattern: pick(PATTERNS),
    radius: pick(RADII),
    frame: pick(FRAMES),
    coverShape: pick(COVER_SHAPES),
    particle: pick(PARTICLES),
    animation: pick(ANIMATIONS.filter((a) => a !== "none")),
    heroLayout: pick(HERO_LAYOUTS),
    dateStyle: pick(DATE_STYLES),
    countdownStyle: pick(COUNTDOWN_STYLES),
    cardStyle: pick(CARD_STYLES),
    corners: Math.random() < 0.7,
  };
}
