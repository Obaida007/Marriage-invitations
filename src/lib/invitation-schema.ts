import { z } from "zod";

const str = (max: number) => z.string().trim().max(max);
const optionalUrl = z
  .string()
  .trim()
  .max(2000)
  .refine((v) => v === "" || v.startsWith("/") || /^https?:\/\//i.test(v), "رابط غير صالح")
  .default("");

export const THEME_IDS = [
  "royal-gold",
  "blush-floral",
  "night-royal",
  "olive-garden",
  "modern-minimal",
  "desert-sand",
  "emerald-palace",
  "burgundy-velvet",
  "lavender-dream",
  "andalusian-turquoise",
  "rose-gold",
  "black-gold",
  "pearl-blue",
  "damascene-rose",
  "moroccan-terracotta",
] as const;
export const FONT_IDS = [
  "amiri",
  "aref-ruqaa",
  "reem-kufi",
  "el-messiri",
  "lateef",
  "cairo",
  "tajawal",
  "rakkas",
  "mirza",
  "scheherazade",
  "noto-kufi",
  "almarai",
  "changa",
  "playfair",
  "cormorant",
  "great-vibes",
] as const;
export const ORNAMENTS = ["arabesque", "floral", "geometric", "leaves", "stars", "line", "dunes"] as const;
export const PATTERNS = ["none", "arabesque", "floral", "geometric", "stars", "lattice", "dots"] as const;
export const RADII = ["sharp", "soft", "round"] as const;
export const FRAMES = ["none", "single", "double"] as const;
export const COVER_SHAPES = ["arch", "circle", "rounded", "square"] as const;
export const PARTICLES = ["petals", "hearts", "stars", "sparkles"] as const;
export const HEADING_SCALES = ["sm", "md", "lg", "xl"] as const;
export const ANIMATIONS = ["fade", "slide", "zoom", "none"] as const;
export const HERO_TONES = ["auto", "light", "dark"] as const;
export const BACKGROUND_SCOPES = ["hero", "page"] as const;
export const HERO_LAYOUTS = ["classic", "card", "poster", "split", "monogram"] as const;
export const DATE_STYLES = ["ribbon", "calendar", "stacked", "minimal"] as const;
export const COUNTDOWN_STYLES = ["boxes", "circles", "minimal"] as const;
export const CARD_STYLES = ["elevated", "outline", "glass", "minimal"] as const;
export const SECTION_IDS = ["countdown", "events", "program", "gallery", "notes", "rsvp", "wishes"] as const;
export const COLOR_KEYS = ["bg", "surface", "text", "muted", "accent", "border", "envelope", "seal"] as const;

const hex = z
  .string()
  .regex(/^(#[0-9a-fA-F]{6})?$/)
  .default("");
/** "" means "inherit from the selected theme". */
const orInherit = <T extends readonly [string, ...string[]]>(values: T) => z.enum(values).or(z.literal("")).default("");
export const OPENING_PRESETS = ["bismillah", "quran-rum", "quran-naba", "none", "custom"] as const;
export const EVENT_ICONS = ["rings", "hall", "dinner", "music", "camera", "cake", "car", "heart", "moon"] as const;

export const eventSchema = z.object({
  id: str(32),
  title: str(80).min(1, "عنوان الحفل مطلوب"),
  /** Local wall-clock time of the venue, "YYYY-MM-DDTHH:mm". */
  startsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "صيغة التاريخ غير صحيحة"),
  endsAt: z
    .string()
    .regex(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})?$/)
    .default(""),
  venueName: str(120).default(""),
  address: str(300).default(""),
  mapUrl: optionalUrl,
  /** Optional coordinates, used for the embedded map when present. */
  lat: z.number().min(-90).max(90).nullable().default(null),
  lng: z.number().min(-180).max(180).nullable().default(null),
  note: str(200).default(""),
});

export const programItemSchema = z.object({
  id: str(32),
  time: str(20).default(""),
  title: str(100).min(1),
  icon: z.enum(EVENT_ICONS).default("heart"),
});

export const invitationContentSchema = z.object({
  locale: z.enum(["ar", "en"]).default("ar"),

  couple: z.object({
    groomName: str(60).min(1, "اسم العريس مطلوب"),
    brideName: str(60).min(1, "اسم العروس مطلوب"),
    groomFamily: str(120).default(""),
    brideFamily: str(120).default(""),
    /** Show the bride's name first (common in some regions / English cards). */
    brideFirst: z.boolean().default(false),
    /** Hide the bride's name and show only initials (a common conservative preference). */
    hideBrideName: z.boolean().default(false),
    /** Optional honorifics, e.g. "المهندس" / "الدكتورة". */
    groomTitle: str(40).default(""),
    brideTitle: str(40).default(""),
    /** Show titles on the same line as the name instead of above it. */
    titlesInline: z.boolean().default(false),
    /** Custom monogram for the wax seal / monogram layout; defaults to initials. */
    monogram: str(8).default(""),
  }),

  texts: z.object({
    opening: z.enum(OPENING_PRESETS).default("bismillah"),
    customOpening: str(300).default(""),
    hosts: str(300).default(""),
    invitationLine: str(500).default(""),
    closing: str(300).default(""),
    /** Custom section headings; empty values fall back to the defaults. */
    sectionTitles: z.partialRecord(z.enum(SECTION_IDS), str(60)).default({}),
  }),

  events: z.array(eventSchema).min(1, "أضف حفلاً واحداً على الأقل").max(6),
  program: z.array(programItemSchema).max(15).default([]),
  notes: z.array(str(160).min(1)).max(10).default([]),

  media: z.object({
    coverImage: optionalUrl,
    /** Full-bleed background image for the first (hero) section. */
    heroBackground: optionalUrl,
    /** Optional looping background video (muted); the image is used as its poster. */
    backgroundVideo: optionalUrl,
    gallery: z.array(optionalUrl).max(12).default([]),
    musicUrl: optionalUrl,
  }),

  style: z.object({
    theme: z.enum(THEME_IDS).default("royal-gold"),
    /** Legacy accent override; `colors.accent` takes precedence. */
    accent: hex,
    /** Per-color overrides of the theme palette. */
    colors: z.partialRecord(z.enum(COLOR_KEYS), hex).default({}),
    headingFont: z.enum(FONT_IDS).default("aref-ruqaa"),
    bodyFont: z.enum(FONT_IDS).default("amiri"),
    headingScale: z.enum(HEADING_SCALES).default("md"),
    ornament: orInherit(ORNAMENTS),
    pattern: orInherit(PATTERNS),
    radius: orInherit(RADII),
    frame: orInherit(FRAMES),
    coverShape: orInherit(COVER_SHAPES),
    corners: z.boolean().default(true),
    animation: z.enum(ANIMATIONS).default("fade"),
    envelope: z.boolean().default(true),
    petals: z.boolean().default(true),
    particle: orInherit(PARTICLES),
    heroTone: z.enum(HERO_TONES).default("auto"),
    /** Overlay opacity over the hero background image, 0–95 (%). */
    heroOverlay: z.number().int().min(0).max(95).default(55),
    heroBlur: z.number().int().min(0).max(12).default(0),
    /** Whether the background image/video covers only the first section or the whole page. */
    backgroundScope: z.enum(BACKGROUND_SCOPES).default("hero"),
    heroLayout: orInherit(HERO_LAYOUTS),
    dateStyle: orInherit(DATE_STYLES),
    countdownStyle: orInherit(COUNTDOWN_STYLES),
    cardStyle: orInherit(CARD_STYLES),
  }),

  sections: z.array(z.enum(SECTION_IDS)).max(SECTION_IDS.length).default([...SECTION_IDS]),

  features: z.object({
    countdown: z.boolean().default(true),
    hijriDate: z.boolean().default(true),
    map: z.boolean().default(true),
    calendar: z.boolean().default(true),
    rsvp: z.boolean().default(true),
    wishes: z.boolean().default(true),
    gallery: z.boolean().default(true),
    program: z.boolean().default(true),
    music: z.boolean().default(false),
    qrPass: z.boolean().default(true),
  }),

  rsvp: z.object({
    deadline: z
      .string()
      .regex(/^(\d{4}-\d{2}-\d{2})?$/)
      .default(""),
    /** Allow anyone with the general link to RSVP (not only listed guests). */
    openRsvp: z.boolean().default(true),
    defaultCompanions: z.number().int().min(0).max(20).default(0),
    askNote: z.boolean().default(true),
  }),

  contact: z.object({
    name: str(60).default(""),
    phone: str(30).default(""),
  }),

  timezone: str(64).default("Asia/Riyadh"),
});

export type InvitationContent = z.infer<typeof invitationContentSchema>;
export type InvitationEvent = z.infer<typeof eventSchema>;
export type ProgramItem = z.infer<typeof programItemSchema>;
export type ThemeId = (typeof THEME_IDS)[number];
export type FontId = (typeof FONT_IDS)[number];
export type OrnamentId = (typeof ORNAMENTS)[number];
export type PatternId = (typeof PATTERNS)[number];
export type SectionId = (typeof SECTION_IDS)[number];
export type ColorKey = (typeof COLOR_KEYS)[number];
export type InvitationStyle = InvitationContent["style"];

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "الرابط قصير جداً")
  .max(48, "الرابط طويل جداً")
  .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, "استخدم أحرفاً إنجليزية صغيرة وأرقاماً وشرطات فقط");

export const RESERVED_SLUGS = new Set(["api", "create", "manage", "admin", "new", "i", "demo", "templates"]);

export const rsvpInputSchema = z.object({
  slug: slugSchema,
  guestToken: z.string().max(32).optional(),
  name: str(80).min(2, "الاسم مطلوب"),
  phone: str(30).optional().default(""),
  status: z.enum(["attending", "declined"]),
  attendingCount: z.number().int().min(0).max(21),
  note: str(300).optional().default(""),
});

export const wishInputSchema = z.object({
  slug: slugSchema,
  guestToken: z.string().max(32).optional(),
  name: str(80).min(2, "الاسم مطلوب"),
  message: str(500).min(2, "اكتب تهنئتك"),
});

export const guestInputSchema = z.object({
  name: str(80).min(1, "الاسم مطلوب"),
  phone: str(30).optional().default(""),
  side: z.enum(["groom", "bride", "both"]).default("both"),
  maxCompanions: z.number().int().min(0).max(20).default(0),
});

export const guestPatchSchema = guestInputSchema.partial().extend({
  status: z.enum(["pending", "attending", "declined"]).optional(),
  attendingCount: z.number().int().min(0).max(21).optional(),
  checkedIn: z.boolean().optional(),
});
