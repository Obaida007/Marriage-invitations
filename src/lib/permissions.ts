import type { InvitationContent } from "./invitation-schema";
import { zonedToDate } from "./dates";

/** Each invitation can be managed by at most this many user accounts. */
export const MAX_MEMBERS = 2;

export type Role = "admin" | "owner";

export interface Access {
  role: Role;
  /** The occasion is over (or otherwise frozen) for this user: read-only. */
  locked: boolean;
  canEdit: boolean;
  canManageGuests: boolean;
  canModerateWishes: boolean;
  canCheckIn: boolean;
  /** Date/time, events list, couple names, link, timezone. Admin only. */
  canEditCoreFields: boolean;
  canManageAccess: boolean;
  canDelete: boolean;
  lockAt: string;
  unlockUntil: string | null;
}

/**
 * When the occasion ends: the end of the venue-local day of the latest event,
 * or that event's explicit end time if later (e.g. a party that runs past midnight).
 */
export function eventLockTime(content: InvitationContent): Date {
  let latest = 0;
  for (const e of content.events) {
    const endOfDay = zonedToDate(`${e.startsAt.slice(0, 10)}T23:59`, content.timezone).getTime() + 59_000;
    const explicit = e.endsAt ? zonedToDate(e.endsAt, content.timezone).getTime() : 0;
    latest = Math.max(latest, endOfDay, explicit);
  }
  return new Date(latest);
}

export function isEventOver(content: InvitationContent, now = Date.now()) {
  return eventLockTime(content).getTime() < now;
}

export function computeAccess(role: Role, content: InvitationContent, unlockUntil: Date | null, now = Date.now()): Access {
  const lockAt = eventLockTime(content);
  const admin = role === "admin";
  const overridden = !!unlockUntil && unlockUntil.getTime() > now;
  const locked = !admin && lockAt.getTime() < now && !overridden;
  return {
    role,
    locked,
    canEdit: !locked,
    canManageGuests: !locked,
    canModerateWishes: !locked,
    canCheckIn: !locked,
    canEditCoreFields: admin,
    canManageAccess: admin,
    canDelete: admin,
    lockAt: lockAt.toISOString(),
    unlockUntil: unlockUntil ? unlockUntil.toISOString() : null,
  };
}

/**
 * Returns an error message if `next` changes a field that ties the invitation
 * to its occasion. Owners may edit everything else (texts, design, venue…),
 * but not what would let one invitation be reused for a different wedding.
 */
export function coreFieldViolation(prev: InvitationContent, next: InvitationContent): string | null {
  if (prev.couple.groomName.trim() !== next.couple.groomName.trim() || prev.couple.brideName.trim() !== next.couple.brideName.trim()) {
    return "لا يمكن تعديل أسماء العروسين، تواصل مع الإدارة";
  }
  if (prev.timezone !== next.timezone) return "لا يمكن تعديل المنطقة الزمنية للمناسبة";
  if (prev.events.length !== next.events.length || prev.events.some((e, i) => e.id !== next.events[i]?.id)) {
    return "لا يمكن إضافة حفلات أو حذفها، تواصل مع الإدارة";
  }
  for (let i = 0; i < prev.events.length; i++) {
    if (prev.events[i].startsAt !== next.events[i].startsAt || prev.events[i].endsAt !== next.events[i].endsAt) {
      return "لا يمكن تعديل تاريخ أو وقت المناسبة، تواصل مع الإدارة";
    }
  }
  return null;
}

/** Content rules that apply to everyone. */
export function contentRuleViolation(content: InvitationContent): string | null {
  const first = [...content.events].sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0];
  if (content.rsvp.deadline && first && content.rsvp.deadline > first.startsAt.slice(0, 10)) {
    return "آخر موعد لتأكيد الحضور يجب أن يكون قبل تاريخ المناسبة";
  }
  return null;
}

/** Self check-in at the door opens this long before an event starts. */
export const CHECKIN_OPENS_BEFORE_MS = 3 * 3600_000;

export type CheckinWindow = { open: true } | { open: false; reason: "before" | "after"; opensAt?: string };

/**
 * The venue QR only works on the day: from 3 hours before an event until the
 * end of that event's day (or its explicit end time, if later).
 */
export function selfCheckinWindow(content: InvitationContent, now = Date.now()): CheckinWindow {
  let nextOpen = Infinity;
  for (const e of content.events) {
    const start = zonedToDate(e.startsAt, content.timezone).getTime();
    const endOfDay = zonedToDate(`${e.startsAt.slice(0, 10)}T23:59`, content.timezone).getTime() + 59_000;
    const end = Math.max(endOfDay, e.endsAt ? zonedToDate(e.endsAt, content.timezone).getTime() : 0);
    const opens = start - CHECKIN_OPENS_BEFORE_MS;
    if (now >= opens && now <= end) return { open: true };
    if (opens > now) nextOpen = Math.min(nextOpen, opens);
  }
  return nextOpen === Infinity ? { open: false, reason: "after" } : { open: false, reason: "before", opensAt: new Date(nextOpen).toISOString() };
}
