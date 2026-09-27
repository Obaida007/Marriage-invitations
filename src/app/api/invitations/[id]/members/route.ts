import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/lib/db";
import { jsonError, readJson, requireAccess } from "@/lib/api";
import { listMembers } from "@/lib/data";
import { MAX_MEMBERS } from "@/lib/permissions";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/invitations/[id]/members">) {
  const { id } = await ctx.params;
  const auth = await requireAccess(id, "view");
  if (!auth.ok) return auth.response;
  return NextResponse.json({ members: await listMembers(id), max: MAX_MEMBERS });
}

/** Grants an existing owner account access to this invitation (admin only). */
export async function POST(req: NextRequest, ctx: RouteContext<"/api/invitations/[id]/members">) {
  const { id } = await ctx.params;
  const auth = await requireAccess(id, "admin");
  if (!auth.ok) return auth.response;
  // Members are picked from existing accounts by id — never free-typed names.
  const body = await readJson(req, z.object({ userId: z.string({ error: "اختر مستخدماً من القائمة" }).trim().min(1, "اختر مستخدماً من القائمة").max(32) }));
  if (!body.ok) return body.response;
  const db = await getDb();
  const user = await db.query.users.findFirst({ where: eq(schema.users.id, body.data.userId) });
  if (!user) return jsonError("المستخدم غير موجود", 404);
  if (user.role === "admin") return jsonError("حسابات الإدارة لديها صلاحية على كل الدعوات", 422);
  if (!user.active) return jsonError("هذا الحساب موقوف، فعّله أولاً من صفحة المستخدمين", 422);
  const members = await listMembers(id);
  if (members.some((m) => m.id === user.id)) return jsonError("هذا المستخدم مضاف مسبقاً", 409);
  if (members.length >= MAX_MEMBERS) return jsonError(`وصلت الدعوة إلى الحد الأقصى للمستخدمين (${MAX_MEMBERS})`, 422);
  await db.insert(schema.invitationMembers).values({ invitationId: id, userId: user.id });
  return NextResponse.json({ members: await listMembers(id) }, { status: 201 });
}

export async function DELETE(req: NextRequest, ctx: RouteContext<"/api/invitations/[id]/members">) {
  const { id } = await ctx.params;
  const auth = await requireAccess(id, "admin");
  if (!auth.ok) return auth.response;
  const userId = req.nextUrl.searchParams.get("userId") ?? "";
  const db = await getDb();
  await db.delete(schema.invitationMembers).where(and(eq(schema.invitationMembers.invitationId, id), eq(schema.invitationMembers.userId, userId)));
  return NextResponse.json({ members: await listMembers(id) });
}
