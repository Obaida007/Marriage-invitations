import { NextResponse, type NextRequest } from "next/server";
import { getManagedInvitation } from "@/lib/data";
import { manageCookieName } from "@/lib/auth";

/** Exchanges a manage link (?key=…) for an httpOnly cookie, then redirects to a clean URL. */
export async function GET(req: NextRequest, ctx: RouteContext<"/manage/[id]/access">) {
  const { id } = await ctx.params;
  // Accepts the bare key or a pasted full manage link.
  const raw = req.nextUrl.searchParams.get("key")?.trim() ?? "";
  const key = raw.match(/[?&]key=([A-Za-z0-9]+)/)?.[1] ?? raw;
  const inv = await getManagedInvitation(id, key);
  const url = new URL(`/manage/${id}`, req.nextUrl.origin);
  if (!inv || !key) {
    url.searchParams.set("error", "1");
    return NextResponse.redirect(url);
  }
  const res = NextResponse.redirect(url);
  res.cookies.set(manageCookieName(id), key, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
