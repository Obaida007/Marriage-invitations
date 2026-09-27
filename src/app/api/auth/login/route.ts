import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { attemptLogin, ensureAdmin } from "@/lib/auth";
import { jsonError, rateLimit, readJson } from "@/lib/api";

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, "login", 20, 15 * 60 * 1000);
  if (limited) return limited;
  await ensureAdmin();
  const body = await readJson(req, z.object({ username: z.string().trim().min(1).max(60), password: z.string().min(1).max(200) }));
  if (!body.ok) return body.response;
  const result = await attemptLogin(body.data.username, body.data.password);
  if (!result.ok) return jsonError(result.error, 401);
  const { user } = result;
  const next = user.mustChangePassword ? "/account/password" : user.role === "admin" ? "/admin" : "/my";
  return NextResponse.json({ ok: true, next });
}
