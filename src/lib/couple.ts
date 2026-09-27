import type { InvitationContent } from "./invitation-schema";

export function coupleInitials(c: InvitationContent["couple"]) {
  const g = c.groomName.trim().charAt(0);
  const b = c.brideName.trim().charAt(0);
  return c.brideFirst ? `${b} ${g}` : `${g} ${b}`;
}

export function coupleTitle(c: InvitationContent["couple"], locale: "ar" | "en") {
  const bride = c.hideBrideName ? `${c.brideName.trim().charAt(0)}.` : c.brideName;
  const sep = locale === "ar" ? " و" : " & ";
  return c.brideFirst ? `${bride}${sep}${c.groomName}` : `${c.groomName}${sep}${bride}`;
}
