const AR_TO_LATIN: Record<string, string> = {
  ا: "a", أ: "a", إ: "e", آ: "a", ب: "b", ت: "t", ث: "th", ج: "j", ح: "h", خ: "kh", د: "d", ذ: "th",
  ر: "r", ز: "z", س: "s", ش: "sh", ص: "s", ض: "d", ط: "t", ظ: "z", ع: "a", غ: "gh", ف: "f", ق: "q",
  ك: "k", ل: "l", م: "m", ن: "n", ه: "h", ة: "a", و: "w", ؤ: "o", ي: "y", ى: "a", ئ: "e", ء: "",
};

export function transliterate(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[ً-ْـ]/g, "")
    .split("")
    .map((c) => AR_TO_LATIN[c] ?? c)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function suggestSlug(groom: string, bride: string) {
  const parts = [transliterate(groom), transliterate(bride)].filter(Boolean);
  const slug = parts.join("-and-").slice(0, 40).replace(/-+$/g, "");
  return slug.length >= 3 ? slug : `wedding-${Date.now().toString(36)}`;
}
