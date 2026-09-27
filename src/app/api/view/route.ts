import { NextResponse, type NextRequest } from "next/server";
import { and, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/lib/db";
import { rateLimit, readJson } from "@/lib/api";
import { getInvitationBySlug } from "@/lib/data";
import { slugSchema } from "@/lib/invitation-schema";

/** Beacon sent when a guest actually opens the invitation (not on prefetch/bots). */
export async function POST(req: NextRequest) {
  if (rateLimit(req, "view", 60, 60 * 1000)) return new NextResponse(null, { status: 204 });
  const body = await readJson(req, z.object({ slug: slugSchema, guestToken: z.string().max(32).optional() }));
  if (!body.ok) return new NextResponse(null, { status: 204 });
  const inv = await getInvitationBySlug(body.data.slug);
  if (!inv) return new NextResponse(null, { status: 204 });
  const db = await getDb();
  await db
    .update(schema.invitations)
    .set({ views: sql`${schema.invitations.views} + 1` })
    .where(eq(schema.invitations.id, inv.id));
  if (body.data.guestToken) {
    await db
      .update(schema.guests)
      .set({ openedAt: new Date() })
      .where(
        and(
          eq(schema.guests.invitationId, inv.id),
          eq(schema.guests.token, body.data.guestToken.toUpperCase()),
          isNull(schema.guests.openedAt),
        ),
      );
  }
  return new NextResponse(null, { status: 204 });
}
