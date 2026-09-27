/** Digits only, without a leading international "00". */
export function normalizePhone(raw: string | null | undefined) {
  return (raw ?? "").replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).replace(/\D/g, "").replace(/^00/, "");
}

/**
 * Loose phone equality: compares the last 9 digits, so "0501234567",
 * "966501234567" and "+966 50 123 4567" all match.
 */
export function samePhone(a: string | null | undefined, b: string | null | undefined) {
  const x = normalizePhone(a);
  const y = normalizePhone(b);
  if (x.length < 7 || y.length < 7) return false;
  return x.slice(-9) === y.slice(-9);
}
