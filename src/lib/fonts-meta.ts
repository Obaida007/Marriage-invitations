import type { FontId } from "./invitation-schema";

export const FONTS: Record<FontId, { label: string; cssVar: string; sample: string }> = {
  amiri: { label: "أميري", cssVar: "var(--f-amiri)", sample: "نسخ كلاسيكي" },
  "aref-ruqaa": { label: "عارف رقعة", cssVar: "var(--f-aref-ruqaa)", sample: "رقعة فاخرة" },
  "reem-kufi": { label: "ريم كوفي", cssVar: "var(--f-reem-kufi)", sample: "كوفي هندسي" },
  "el-messiri": { label: "المسيري", cssVar: "var(--f-el-messiri)", sample: "أنيق وحديث" },
  lateef: { label: "لطيف", cssVar: "var(--f-lateef)", sample: "نسخ ناعم" },
  cairo: { label: "القاهرة", cssVar: "var(--f-cairo)", sample: "عصري واضح" },
  tajawal: { label: "تجوّل", cssVar: "var(--f-tajawal)", sample: "بسيط وخفيف" },
  playfair: { label: "Playfair", cssVar: "var(--f-playfair)", sample: "English serif" },
};
