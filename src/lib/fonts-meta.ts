import type { FontId } from "./invitation-schema";

export const FONTS: Record<FontId, { label: string; cssVar: string; sample: string }> = {
  amiri: { label: "أميري", cssVar: "var(--f-amiri)", sample: "نسخ كلاسيكي" },
  "aref-ruqaa": { label: "عارف رقعة", cssVar: "var(--f-aref-ruqaa)", sample: "رقعة فاخرة" },
  "reem-kufi": { label: "ريم كوفي", cssVar: "var(--f-reem-kufi)", sample: "كوفي هندسي" },
  "el-messiri": { label: "المسيري", cssVar: "var(--f-el-messiri)", sample: "أنيق وحديث" },
  lateef: { label: "لطيف", cssVar: "var(--f-lateef)", sample: "نسخ ناعم" },
  cairo: { label: "القاهرة", cssVar: "var(--f-cairo)", sample: "عصري واضح" },
  tajawal: { label: "تجوّل", cssVar: "var(--f-tajawal)", sample: "بسيط وخفيف" },
  rakkas: { label: "ركّاس", cssVar: "var(--f-rakkas)", sample: "عريض احتفالي" },
  mirza: { label: "ميرزا", cssVar: "var(--f-mirza)", sample: "نستعليق مبسّط" },
  scheherazade: { label: "شهرزاد", cssVar: "var(--f-scheherazade)", sample: "نسخ تراثي" },
  "noto-kufi": { label: "نوتو كوفي", cssVar: "var(--f-noto-kufi)", sample: "كوفي حديث" },
  almarai: { label: "المراعي", cssVar: "var(--f-almarai)", sample: "نظيف ومقروء" },
  changa: { label: "شانجا", cssVar: "var(--f-changa)", sample: "هندسي جريء" },
  playfair: { label: "Playfair", cssVar: "var(--f-playfair)", sample: "English serif" },
  cormorant: { label: "Cormorant", cssVar: "var(--f-cormorant)", sample: "Elegant serif" },
  "great-vibes": { label: "Great Vibes", cssVar: "var(--f-great-vibes)", sample: "English script" },
};
