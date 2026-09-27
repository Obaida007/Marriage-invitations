import { NextResponse, type NextRequest } from "next/server";
import { RESERVED_SLUGS, slugSchema } from "@/lib/invitation-schema";
import { getInvitationBySlug } from "@/lib/data";

export async function GET(req: NextRequest) {
  const parsed = slugSchema.safeParse(req.nextUrl.searchParams.get("slug") ?? "");
  if (!parsed.success) return NextResponse.json({ available: false, reason: parsed.error.issues[0]?.message });
  const slug = parsed.data;
  if (RESERVED_SLUGS.has(slug)) return NextResponse.json({ available: false, reason: "هذا الرابط محجوز" });
  const existing = await getInvitationBySlug(slug);
  const ownId = req.nextUrl.searchParams.get("id");
  const available = !existing || existing.id === ownId;
  return NextResponse.json({ available, reason: available ? undefined : "هذا الرابط مستخدم مسبقاً" });
}
