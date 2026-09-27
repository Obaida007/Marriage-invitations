import { NextResponse, type NextRequest } from "next/server";
import { count, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/lib/db";
import { generateTempPassword, hashPassword } from "@/lib/auth";
import { jsonError, readJson, requireAdmin } from "@/lib/api";
import { newId } from "@/lib/ids";

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "اسم المستخدم قصير جداً")
  .max(32, "اسم المستخدم طويل جداً")
  .regex(/^[a-z0-9][a-z0-9._-]*$/, "اسم المستخدم: أحرف إنجليزية صغيرة وأرقام و . _ - فقط");

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const db = await getDb();
  const list = await db
    .select({
      id: schema.users.id,
      username: schema.users.username,
      name: schema.users.name,
      phone: schema.users.phone,
      role: schema.users.role,
      active: schema.users.active,
      mustChangePassword: schema.users.mustChangePassword,
      lastLoginAt: schema.users.lastLoginAt,
      createdAt: schema.users.createdAt,
      invitations: count(schema.invitationMembers.invitationId),
    })
    .from(schema.users)
    .leftJoin(schema.invitationMembers, eq(schema.invitationMembers.userId, schema.users.id))
    .groupBy(schema.users.id)
    .orderBy(desc(schema.users.createdAt));
  return NextResponse.json({ users: list });
}

/** Creates an owner account with a temporary password that is shown once. */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const body = await readJson(
    req,
    z.object({ username: usernameSchema, name: z.string().trim().min(2, "الاسم مطلوب").max(80), phone: z.string().trim().max(30).optional().default("") }),
  );
  if (!body.ok) return body.response;
  const db = await getDb();
  if (await db.query.users.findFirst({ where: eq(schema.users.username, body.data.username) })) {
    return jsonError("اسم المستخدم مستخدم مسبقاً", 409);
  }
  const tempPassword = generateTempPassword();
  const id = newId();
  await db.insert(schema.users).values({
    id,
    username: body.data.username,
    name: body.data.name,
    phone: body.data.phone || null,
    role: "owner",
    passwordHash: await hashPassword(tempPassword),
    mustChangePassword: true,
  });
  return NextResponse.json({ user: { id, username: body.data.username, name: body.data.name }, tempPassword }, { status: 201 });
}
