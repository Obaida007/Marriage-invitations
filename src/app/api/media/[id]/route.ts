import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { getDb, schema } from "@/lib/db";

export async function GET(req: NextRequest, ctx: RouteContext<"/api/media/[id]">) {
  const { id } = await ctx.params;
  if (!/^[a-z0-9]{16}$/.test(id)) return new Response("Not found", { status: 404 });
  const db = await getDb();
  const row = await db.query.media.findFirst({ where: eq(schema.media.id, id) });
  if (!row) return new Response("Not found", { status: 404 });
  const data = new Uint8Array(row.data);
  const headers = {
    "content-type": row.mime,
    "cache-control": "public, max-age=31536000, immutable",
    "x-content-type-options": "nosniff",
    "accept-ranges": "bytes",
  };
  // Range support so iOS Safari can stream audio.
  const range = req.headers.get("range")?.match(/bytes=(\d*)-(\d*)/);
  if (range) {
    const start = range[1] ? Number(range[1]) : 0;
    const end = range[2] ? Math.min(Number(range[2]), data.length - 1) : data.length - 1;
    if (start > end || start >= data.length) return new Response(null, { status: 416, headers: { "content-range": `bytes */${data.length}` } });
    return new Response(data.slice(start, end + 1), {
      status: 206,
      headers: { ...headers, "content-range": `bytes ${start}-${end}/${data.length}`, "content-length": String(end - start + 1) },
    });
  }
  return new Response(data, { headers: { ...headers, "content-length": String(data.length) } });
}
