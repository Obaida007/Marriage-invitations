import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { getDb, schema } from "./db";
import { verifyKey } from "./auth";
import { invitationContentSchema, type InvitationContent } from "./invitation-schema";

const { invitations, guests, wishes } = schema;

/** Parses stored content through the schema so older rows gain new defaults. */
export function normalizeContent(raw: unknown): InvitationContent {
  const parsed = invitationContentSchema.safeParse(raw);
  return parsed.success ? parsed.data : (raw as InvitationContent);
}

export async function getInvitationBySlug(slug: string) {
  const db = await getDb();
  const row = await db.query.invitations.findFirst({ where: eq(invitations.slug, slug.toLowerCase()) });
  return row ? { ...row, content: normalizeContent(row.content) } : null;
}

export async function getInvitationById(id: string) {
  const db = await getDb();
  const row = await db.query.invitations.findFirst({ where: eq(invitations.id, id) });
  return row ? { ...row, content: normalizeContent(row.content) } : null;
}

/** Returns the invitation only if the manage key is valid. */
export async function getManagedInvitation(id: string, key: string | null | undefined) {
  const inv = await getInvitationById(id);
  if (!inv || !verifyKey(key, inv.manageKeyHash)) return null;
  return inv;
}

export async function getGuestByToken(invitationId: string, token: string | undefined | null) {
  if (!token) return null;
  const db = await getDb();
  return (
    (await db.query.guests.findFirst({
      where: and(eq(guests.invitationId, invitationId), eq(guests.token, token.toUpperCase())),
    })) ?? null
  );
}

export async function listGuests(invitationId: string) {
  const db = await getDb();
  return db.select().from(guests).where(eq(guests.invitationId, invitationId)).orderBy(desc(guests.createdAt));
}

export async function listWishes(invitationId: string, includeHidden = false) {
  const db = await getDb();
  const where = includeHidden
    ? eq(wishes.invitationId, invitationId)
    : and(eq(wishes.invitationId, invitationId), eq(wishes.hidden, false));
  return db.select().from(wishes).where(where).orderBy(desc(wishes.createdAt)).limit(200);
}

export type GuestStats = ReturnType<typeof guestStats>;

export function guestStats(list: (typeof guests.$inferSelect)[]) {
  const s = { total: list.length, attending: 0, declined: 0, pending: 0, headcount: 0, invitedSeats: 0, opened: 0, checkedIn: 0, checkedInSeats: 0 };
  for (const g of list) {
    s[g.status]++;
    if (g.status === "attending") s.headcount += g.attendingCount;
    s.invitedSeats += g.maxCompanions + 1;
    if (g.openedAt) s.opened++;
    if (g.checkedInAt) {
      s.checkedIn++;
      s.checkedInSeats += g.attendingCount || 1;
    }
  }
  return s;
}
