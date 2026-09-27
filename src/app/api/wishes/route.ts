import { NextResponse, type NextRequest } from "next/server";
import { getDb, schema } from "@/lib/db";
import { wishInputSchema } from "@/lib/invitation-schema";
import { jsonError, rateLimit, readJson } from "@/lib/api";
import { getGuestByToken, getInvitationBySlug } from "@/lib/data";
import { newId } from "@/lib/ids";

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, "wish", 10, 10 * 60 * 1000);
  if (limited) return limited;
  const body = await readJson(req, wishInputSchema);
  if (!body.ok) return body.response;
  const inv = await getInvitationBySlug(body.data.slug);
  if (!inv || !inv.published) return jsonError("الدعوة غير موجودة", 404);
  if (!inv.content.features.wishes) return jsonError("دفتر التهاني غير مفعّل", 403);

  const guest = await getGuestByToken(inv.id, body.data.guestToken);
  const db = await getDb();
  const [wish] = await db
    .insert(schema.wishes)
    .values({
      id: newId(),
      invitationId: inv.id,
      guestId: guest?.id ?? null,
      name: body.data.name,
      message: body.data.message,
    })
    .returning();
  return NextResponse.json(
    { wish: { id: wish.id, name: wish.name, message: wish.message, createdAt: wish.createdAt } },
    { status: 201 },
  );
}
