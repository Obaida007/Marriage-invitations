/** Personal invitation link: /i/<invitation>/<guest code>. */
export const guestLink = (origin: string, slug: string, token: string) => `${origin}/i/${slug}/${token}`;

/** Extracts a guest code from a raw code or from a personal link (new or legacy ?g= form). */
export function tokenFromInput(input: string) {
  const v = input.trim();
  return v.match(/[?&]g=([A-Za-z0-9]+)/)?.[1] ?? v.match(/\/i\/[^/?#]+\/([A-Za-z0-9]{4,})/)?.[1] ?? v;
}

/** "شخص واحد" / "شخصين" / "٣ أشخاص" / "١١ شخصاً" — Arabic count agreement. */
export function arabicPeople(n: number, digits: "arab" | "latn" = "arab") {
  const num = new Intl.NumberFormat(digits === "latn" ? "ar-u-nu-latn" : "ar-u-nu-arab").format(n);
  if (n === 1) return "شخص واحد";
  if (n === 2) return "شخصين";
  if (n >= 3 && n <= 10) return `${num} أشخاص`;
  return `${num} شخصاً`;
}
