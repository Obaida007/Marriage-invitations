import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getDb, schema } from "@/lib/db";
import { hashKey, manageCookieName } from "@/lib/auth";
import { newId, newManageKey, randomSlugSuffix } from "@/lib/ids";
import { invitationContentSchema, RESERVED_SLUGS, slugSchema } from "@/lib/invitation-schema";
import { jsonError, rateLimit, readJson } from "@/lib/api";
import { suggestSlug } from "@/lib/slug";
import { getInvitationBySlug } from "@/lib/data";

const createSchema = z.object({
  slug: z.union([slugSchema, z.literal("")]).optional(),
  content: invitationContentSchema,
});

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, "create", 20, 60 * 60 * 1000);
  if (limited) return limited;

  const body = await readJson(req, createSchema);
  if (!body.ok) return body.response;
  const { content } = body.data;

  let slug = body.data.slug || suggestSlug(content.couple.groomName, content.couple.brideName);
  if (RESERVED_SLUGS.has(slug)) return jsonError("هذا الرابط محجوز، اختر رابطاً آخر", 409);
  if (await getInvitationBySlug(slug)) {
    if (body.data.slug) return jsonError("هذا الرابط مستخدم مسبقاً، اختر رابطاً آخر", 409);
    slug = `${slug}-${randomSlugSuffix()}`;
  }

  const id = newId();
  const manageKey = newManageKey();
  const db = await getDb();
  await db.insert(schema.invitations).values({ id, slug, manageKeyHash: hashKey(manageKey), content });

  const res = NextResponse.json({ id, slug, manageKey }, { status: 201 });
  res.cookies.set(manageCookieName(id), manageKey, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
