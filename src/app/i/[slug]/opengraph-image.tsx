import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import { getInvitationBySlug } from "@/lib/data";
import { getDb, schema } from "@/lib/db";
import { resolveStyle } from "@/lib/themes";
import { shapeArabic } from "@/lib/arabic-shaping";
import { formatGregorian, fmtLocale } from "@/lib/dates";

export const alt = "دعوة زفاف";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function coverDataUrl(url: string) {
  const m = url.match(/^\/api\/media\/([a-z0-9]{16})$/);
  if (m) {
    const db = await getDb();
    const row = await db.query.media.findFirst({ where: eq(schema.media.id, m[1]) });
    // Satori can't decode WebP; only embed formats it supports.
    if (row && (row.mime === "image/jpeg" || row.mime === "image/png")) {
      return `data:${row.mime};base64,${Buffer.from(row.data).toString("base64")}`;
    }
    return null;
  }
  return /^https:\/\/.+\.(jpe?g|png)(\?.*)?$/i.test(url) ? url : null;
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const inv = await getInvitationBySlug(slug);
  const [naskh, playfair] = await Promise.all([
    readFile(join(process.cwd(), "src/assets/fonts/NotoNaskhArabic-SemiBold.ttf")),
    readFile(join(process.cwd(), "src/assets/fonts/PlayfairDisplay-Medium.ttf")),
  ]);

  if (!inv) {
    return new ImageResponse(<div style={{ display: "flex", width: "100%", height: "100%", background: "#fbf7ef" }} />, size);
  }

  const c = inv.content;
  const { colors } = resolveStyle(c.style);
  const accent = colors.accent;
  const theme = { colors };
  const ar = c.locale === "ar";
  // Satori's font engine crashes on the Arabic comma glyph lookup, so swap it out.
  const s = (text: string) => {
    const clean = text.replace(/\u060C\s*/g, "  ");
    return ar ? shapeArabic(clean) : clean;
  };
  const bride = c.couple.hideBrideName ? `${c.couple.brideName.charAt(0)}.` : c.couple.brideName;
  const withTitle = (title: string, name: string) => (title.trim() ? `${title.trim()} ${name}` : name);
  const groomLine = withTitle(c.couple.groomTitle ?? "", c.couple.groomName);
  const brideLine = withTitle(c.couple.brideTitle ?? "", bride);
  const names = c.couple.brideFirst ? [brideLine, groomLine] : [groomLine, brideLine];
  const main = c.events[0];
  const cover = c.media.coverImage ? await coverDataUrl(c.media.coverImage) : null;
  const heroBg = c.media.heroBackground ? await coverDataUrl(c.media.heroBackground) : null;
  const longest = Math.max(names[0].length, names[1].length, 1);
  const nameSize = Math.round(Math.min(cover ? 92 : 110, (cover ? 1300 : 2000) / longest));

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: theme.colors.bg,
          color: theme.colors.text,
          fontFamily: ar ? "Naskh" : "Playfair, Naskh",
          padding: 28,
          position: "relative",
        }}
      >
        {heroBg && (
          // Background photo washed with the theme color so the text stays legible.
          <div style={{ display: "flex", position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}>
            <img src={heroBg} alt="" width={1200} height={630} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
            <div style={{ display: "flex", position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: theme.colors.bg, opacity: 0.78 }} />
          </div>
        )}
        <div
          style={{
            display: "flex",
            flex: 1,
            flexDirection: ar ? "row-reverse" : "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 56,
            border: `3px solid ${accent}`,
            borderRadius: 24,
            outline: `1px solid ${accent}`,
            outlineOffset: -14,
            padding: 40,
          }}
        >
          {cover && (
            <img
              src={cover}
              alt=""
              width={300}
              height={400}
              style={{ objectFit: "cover", borderRadius: "150px 150px 16px 16px", border: `6px solid ${theme.colors.surface}` }}
            />
          )}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <div style={{ fontSize: 36, color: theme.colors.muted }}>{s(ar ? "دعوة زفاف" : "Wedding Invitation")}</div>
            <div style={{ fontSize: nameSize, color: accent, lineHeight: 1.25, marginTop: 12 }}>{s(names[0])}</div>
            <div style={{ fontSize: 48, color: accent }}>{ar ? s("و") : "&"}</div>
            <div style={{ fontSize: nameSize, color: accent, lineHeight: 1.25 }}>{s(names[1])}</div>
            {main && (
              <div
                style={{
                  display: "flex",
                  marginTop: 20,
                  fontSize: 34,
                  color: theme.colors.text,
                  borderTop: `1px solid ${accent}`,
                  borderBottom: `1px solid ${accent}`,
                  padding: "6px 28px",
                }}
              >
                {s(formatGregorian(main.startsAt, fmtLocale(c.locale, c.numerals)))}
              </div>
            )}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Naskh", data: naskh, weight: 600, style: "normal" },
        { name: "Playfair", data: playfair, weight: 500, style: "normal" },
      ],
    },
  );
}
