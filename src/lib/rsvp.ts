import type { InvitationContent } from "./invitation-schema";
import { zonedToDate } from "./dates";

export function isRsvpClosed(content: InvitationContent, now = Date.now()) {
  const first = content.events[0];
  if (content.rsvp.deadline) {
    return zonedToDate(`${content.rsvp.deadline}T23:59`, content.timezone).getTime() < now;
  }
  // Without an explicit deadline, RSVPs close when the first event starts.
  return first ? zonedToDate(first.startsAt, content.timezone).getTime() < now : false;
}
