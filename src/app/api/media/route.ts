import { NextResponse, type NextRequest } from "next/server";
import { getDb, schema } from "@/lib/db";
import { jsonError, rateLimit, requireUser } from "@/lib/api";
import { newId } from "@/lib/ids";

const LIMITS: Record<string, number> = {
  "image/webp": 2_500_000,
  "image/jpeg": 2_500_000,
  "image/png": 2_500_000,
  "audio/mpeg": 8_000_000,
  "audio/mp4": 8_000_000,
  "audio/aac": 8_000_000,
  "audio/ogg": 8_000_000,
  "video/mp4": 20_000_000,
  "video/webm": 20_000_000,
};

// Magic-byte check so the declared type can't be spoofed into e.g. HTML.
function sniff(buf: Buffer, kind: string | null): string | null {
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.subarray(0, 3).toString("ascii") === "ID3" || (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0)) {
    return (buf[1] & 0x06) === 0 && buf[0] === 0xff ? "audio/aac" : "audio/mpeg";
  }
  if (buf.subarray(4, 8).toString("ascii") === "ftyp") {
    // Same container for M4A audio and MP4/MOV video; the brand and the caller's hint decide.
    const brand = buf.subarray(8, 12).toString("ascii");
    return brand.startsWith("M4A") || (kind !== "video" && brand.startsWith("M4B")) ? "audio/mp4" : kind === "audio" ? "audio/mp4" : "video/mp4";
  }
  if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) return "video/webm";
  if (buf.subarray(0, 4).toString("ascii") === "OggS") return "audio/ogg";
  return null;
}

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, "media", 40, 60 * 60 * 1000);
  if (limited) return limited;
  // Only signed-in users can upload (prevents anonymous use as file hosting).
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return jsonError("لم يتم إرفاق ملف");
  const buf = Buffer.from(await file.arrayBuffer());
  const kind = typeof form?.get("kind") === "string" ? String(form?.get("kind")) : null;
  const mime = sniff(buf, kind);
  if (!mime) return jsonError("نوع الملف غير مدعوم (الصور: JPG/PNG/WebP، الصوت: MP3/M4A/OGG، الفيديو: MP4/WebM)");
  if (kind === "video" && !mime.startsWith("video/")) return jsonError("الملف ليس فيديو (MP4 أو WebM)");
  if (buf.length > LIMITS[mime]) {
    return jsonError(`حجم الملف كبير، الحد الأقصى ${(LIMITS[mime] / 1_000_000).toFixed(1)} ميغابايت`, 413);
  }
  const id = newId();
  const db = await getDb();
  await db.insert(schema.media).values({ id, mime, data: buf, size: buf.length });
  return NextResponse.json({ id, url: `/api/media/${id}` }, { status: 201 });
}
