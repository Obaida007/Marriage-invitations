/**
 * Readable Latin slugs from Arabic names: "محمد" + "سارة" → "mohammed-sara".
 * Common names use their conventional English spelling; others fall back to a
 * phonetic transliteration with light vowel insertion.
 */

const NAMES: Record<string, string> = {
  // Men
  محمد: "mohammed", احمد: "ahmed", محمود: "mahmoud", مصطفى: "mustafa", علي: "ali", عمر: "omar", عثمان: "othman",
  خالد: "khaled", سعد: "saad", سعود: "saud", فهد: "fahad", فيصل: "faisal", يوسف: "yousef", ابراهيم: "ibrahim",
  اسماعيل: "ismail", حسن: "hassan", حسين: "hussein", حمزه: "hamza", طارق: "tariq", ماجد: "majed", بدر: "badr",
  تركي: "turki", ناصر: "nasser", سلطان: "sultan", سلمان: "salman", راشد: "rashed", زياد: "ziad", ياسر: "yasser",
  سامي: "sami", هاني: "hani", وليد: "waleed", نواف: "nawaf", بندر: "bandar", مشعل: "mishal", منصور: "mansour",
  عادل: "adel", كريم: "karim", انس: "anas", ادم: "adam", مالك: "malek", ريان: "rayan", حمد: "hamad", جاسم: "jassim",
  يزن: "yazan", ليث: "laith", معاذ: "muath", ايمن: "ayman", رامي: "rami", مازن: "mazen", نايف: "naif", سيف: "saif",
  هشام: "hisham", عماد: "emad", جمال: "jamal", صالح: "saleh", سالم: "salem", مروان: "marwan", عمرو: "amr", شادي: "shadi",
  عبدالله: "abdullah", عبدالرحمن: "abdulrahman", عبدالعزيز: "abdulaziz", عبدالملك: "abdulmalik", عبدالكريم: "abdulkarim",
  عبدالرحيم: "abdulrahim", عبدالمجيد: "abdulmajeed", عبدالاله: "abdulelah", عبدالمحسن: "abdulmohsen", عبدالهادي: "abdulhadi",
  عبدالسلام: "abdulsalam", عبدالحميد: "abdulhameed", عبداللطيف: "abdullatif", عبدالوهاب: "abdulwahab", بسام: "bassam",
  حازم: "hazem", حسام: "hussam", رائد: "raed", زيد: "zaid", شريف: "sherif", طلال: "talal", عصام: "essam", غسان: "ghassan",
  فارس: "fares", فراس: "firas", قاسم: "qasim", ماهر: "maher", مهند: "mohannad", نبيل: "nabil", نزار: "nizar", هيثم: "haitham",
  وائل: "wael", معتز: "moataz", مؤيد: "moayad", انور: "anwar", بشار: "bashar", ياسين: "yaseen", يحيى: "yahya", يعقوب: "yaqoub", موسى: "musa", عيسى: "issa", داود: "dawood", سليمان: "sulaiman",
  // Women
  ساره: "sara", نوره: "noura", نور: "noor", مريم: "maryam", فاطمه: "fatima", عائشه: "aisha", خديجه: "khadija", زينب: "zainab",
  ليلى: "layla", ليان: "layan", لمى: "lama", ريم: "reem", هند: "hind", دانه: "dana", جود: "joud", رهف: "rahaf", شهد: "shahad",
  غاده: "ghada", منى: "mona", هيا: "haya", هيفاء: "haifa", امل: "amal", امنه: "amna", حلا: "hala", حنان: "hanan", رنا: "rana",
  رغد: "raghad", سلمى: "salma", سماح: "samah", شيماء: "shaimaa", عبير: "abeer", علياء: "alia", لينا: "lina", ديما: "dima",
  رزان: "razan", روان: "rawan", جنى: "jana", تالا: "tala", ميار: "mayar", ملك: "malak", يارا: "yara", اسماء: "asmaa", ايمان: "eman",
  الاء: "alaa", بشرى: "bushra", نوف: "nouf", العنود: "alanoud", الجوهره: "aljawhara", وعد: "waad", اروى: "arwa", مها: "maha",
  منيره: "munira", لطيفه: "latifa", حصه: "hessa", مشاعل: "mashael", اريج: "areej", بسمه: "basma", دعاء: "doaa", رحاب: "rehab",
  سميه: "sumaya", فرح: "farah", نجلاء: "najla", هاله: "hala", رشا: "rasha", سوسن: "sawsan", نادين: "nadine", ياسمين: "yasmin",
  رؤى: "roaa", لجين: "lujain", غلا: "ghala", جوري: "jouri", ريتال: "rital", ريماس: "rimas", بتول: "batoul", رنيم: "raneem", جمانه: "jumana", ريناد: "rinad", شذى: "shatha", لبنى: "lubna", ندى: "nada", سجى: "saja",
};

const LETTERS: Record<string, string> = {
  ا: "a", ب: "b", ت: "t", ث: "th", ج: "j", ح: "h", خ: "kh", د: "d", ذ: "th", ر: "r", ز: "z", س: "s", ش: "sh", ص: "s",
  ض: "d", ط: "t", ظ: "z", ع: "a", غ: "gh", ف: "f", ق: "q", ك: "k", ل: "l", م: "m", ن: "n", ه: "h", ة: "a", و: "w",
  ي: "y", ى: "a", ء: "", ئ: "e", ؤ: "o",
};
const VOWELISH = new Set(["ا", "و", "ي", "ى", "ة", "ع"]);

/** Removes diacritics/tatweel and unifies letter variants (أإآ→ا, ة→ه for lookup). */
function normalize(word: string) {
  return word
    .trim()
    .replace(/[ً-ٰٟـ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/^عبد\s+ال/, "عبدال");
}

/** Phonetic fallback: letters mapped, with an "a" between consonants that meet. */
function phonetic(word: string) {
  const chars = [...word];
  let out = "";
  chars.forEach((c, i) => {
    const latin = LETTERS[c] ?? (/[a-z0-9]/i.test(c) ? c.toLowerCase() : "");
    if (!latin) return;
    out += latin;
    const next = chars[i + 1];
    if (next && LETTERS[next] !== undefined && !VOWELISH.has(c) && !VOWELISH.has(next)) out += "a";
  });
  return out.replace(/(.)\1{2,}/g, "$1$1");
}

/** Latin form of a single (first) name. */
export function transliterateName(name: string) {
  const first = normalize(name).split(/\s+/)[0] ?? "";
  if (/^[a-z0-9-]+$/i.test(first)) return first.toLowerCase();
  const key = first.replace(/ة$/, "ه");
  return NAMES[key] ?? NAMES[first] ?? phonetic(first);
}

/** Generic transliteration of free text (used for any leftover Latin cleanup). */
export function transliterate(input: string) {
  return normalize(input)
    .toLowerCase()
    .split(/\s+/)
    .map((w) => transliterateName(w))
    .join("-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * "mohammed-sara". When the bride's name is hidden for privacy, the slug
 * must not reveal it either, so it becomes "mohammed-wedding".
 */
export function suggestSlug(groom: string, bride: string, hideBride = false) {
  const g = transliterateName(groom).replace(/[^a-z0-9]/g, "");
  const b = hideBride ? "wedding" : transliterateName(bride).replace(/[^a-z0-9]/g, "");
  const slug = [g, b].filter(Boolean).join("-").slice(0, 40).replace(/-+$/g, "");
  return slug.length >= 3 ? slug : `wedding-${Date.now().toString(36)}`;
}
