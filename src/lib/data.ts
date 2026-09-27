import "server-only";
import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb, schema } from "./db";
import type { SessionUser } from "./auth";
import { computeAccess, type Access } from "./permissions";
import { invitationContentSchema, type InvitationContent } from "./invitation-schema";

const { invitations, guests, wishes, users, invitationMembers } = schema;

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

export type LoadedInvitation = NonNullable<Awaited<ReturnType<typeof getInvitationById>>>;

export async function isMember(invitationId: string, userId: string) {
  const db = await getDb();
  const row = await db.query.invitationMembers.findFirst({
    where: and(eq(invitationMembers.invitationId, invitationId), eq(invitationMembers.userId, userId)),
  });
  return !!row;
}

/** The invitation plus what this user may do with it, or null if they have no access. */
export async function getInvitationAccess(id: string, user: SessionUser | null): Promise<{ inv: LoadedInvitation; access: Access } | null> {
  if (!user) return null;
  const inv = await getInvitationById(id);
  if (!inv) return null;
  if (user.role !== "admin" && !(await isMember(id, user.id))) return null;
  return { inv, access: computeAccess(user.role, inv.content, inv.unlockUntil) };
}

export async function listMembers(invitationId: string) {
  const db = await getDb();
  return db
    .select({ id: users.id, username: users.username, name: users.name, phone: users.phone, active: users.active, lastLoginAt: users.lastLoginAt })
    .from(invitationMembers)
    .innerJoin(users, eq(invitationMembers.userId, users.id))
    .where(eq(invitationMembers.invitationId, invitationId))
    .orderBy(invitationMembers.createdAt);
}

/** Invitation cards for "My invitations" (or every invitation for admins). */
export async function listInvitationsFor(user: SessionUser) {
  const db = await getDb();
  const rows =
    user.role === "admin"
      ? await db.select().from(invitations).orderBy(desc(invitations.createdAt))
      : await db
          .select({ inv: invitations })
          .from(invitationMembers)
          .innerJoin(invitations, eq(invitationMembers.invitationId, invitations.id))
          .where(eq(invitationMembers.userId, user.id))
          .orderBy(desc(invitations.createdAt))
          .then((r) => r.map((x) => x.inv));
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const stats = await db
    .select({
      invitationId: guests.invitationId,
      total: count(),
      attending: sql<number>`sum(case when ${guests.status} = 'attending' then 1 else 0 end)`,
      headcount: sql<number>`sum(case when ${guests.status} = 'attending' then ${guests.attendingCount} else 0 end)`,
    })
    .from(guests)
    .where(inArray(guests.invitationId, ids))
    .groupBy(guests.invitationId);
  const members = await db
    .select({ invitationId: invitationMembers.invitationId, username: users.username, name: users.name })
    .from(invitationMembers)
    .innerJoin(users, eq(invitationMembers.userId, users.id))
    .where(inArray(invitationMembers.invitationId, ids));
  return rows.map((r) => {
    const content = normalizeContent(r.content);
    const st = stats.find((x) => x.invitationId === r.id);
    return {
      id: r.id,
      slug: r.slug,
      content,
      published: r.published,
      views: r.views,
      maxGuests: r.maxGuests,
      access: computeAccess(user.role, content, r.unlockUntil),
      guests: st?.total ?? 0,
      headcount: Number(st?.headcount ?? 0),
      members: members.filter((m) => m.invitationId === r.id).map(({ username, name }) => ({ username, name })),
    };
  });
}

export async function countGuests(invitationId: string) {
  const db = await getDb();
  const [{ n }] = await db.select({ n: count() }).from(guests).where(eq(guests.invitationId, invitationId));
  return n;
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

export async function getInvitationByCheckinCode(code: string) {
  const db = await getDb();
  const row = await db.query.invitations.findFirst({ where: eq(invitations.checkinCode, code) });
  return row ? { ...row, content: normalizeContent(row.content) } : null;
}

/** Returns the invitation's venue check-in code, creating one on first use. */
export async function ensureCheckinCode(inv: { id: string; checkinCode: string | null }) {
  if (inv.checkinCode) return inv.checkinCode;
  const { newCheckinCode } = await import("./ids");
  const code = newCheckinCode();
  const db = await getDb();
  await db.update(invitations).set({ checkinCode: code }).where(eq(invitations.id, inv.id));
  return code;
}
