import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";
import { requirePageUser } from "@/lib/auth";
import { ensureCheckinCode, getInvitationAccess } from "@/lib/data";
import { getOrigin } from "@/lib/origin";
import { coupleInitials, coupleTitle } from "@/lib/couple";
import { formatGregorian } from "@/lib/dates";
import { resolveStyle } from "@/lib/themes";
import { FONTS } from "@/lib/fonts-meta";
import { PrintButton } from "@/components/checkin/PrintButton";

export const metadata: Metadata = { title: "ملصق تسجيل الحضور", robots: { index: false } };

/** A4 poster with the venue check-in QR, to print and place at the hall entrance. */
export default async function PosterPage(props: PageProps<"/manage/[id]/poster">) {
  const { id } = await props.params;
  const user = await requirePageUser();
  const found = await getInvitationAccess(id, user);
  if (!found) notFound();
  const { inv } = found;
  const code = await ensureCheckinCode(inv);
  const url = `${await getOrigin()}/c/${code}`;
  const c = inv.content;
  const rs = resolveStyle(c.style);
  const svg = await QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: rs.dark ? "#111111" : rs.colors.text, light: "#ffffff" } });
  const main = [...c.events].sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0];

  return (
    <div className="flex flex-1 flex-col items-center bg-stone-200 py-8 print:bg-white print:py-0">
      <style>{`@page { size: A4; margin: 0 } @media print { body { background: white } }`}</style>
      <div className="mb-4 flex gap-2 print:hidden">
        <PrintButton />
        <Link href={`/manage/${id}?tab=checkin`} className="btn-ghost">
          رجوع
        </Link>
      </div>
      <div
        className="relative flex aspect-[210/297] w-[min(210mm,100%)] flex-col items-center justify-center overflow-hidden px-[12mm] py-[14mm] text-center shadow-2xl print:w-[210mm] print:shadow-none"
        style={{ background: rs.colors.bg, color: rs.colors.text, fontFamily: FONTS[c.style.bodyFont]?.cssVar }}
      >
        <div className="pointer-events-none absolute inset-[8mm] border-[5px] border-double" style={{ borderColor: rs.colors.accent, borderRadius: "4mm" }} />
        <div className="flex h-[26mm] w-[26mm] items-center justify-center rounded-full border-[3px] border-double text-[9mm]" style={{ borderColor: rs.colors.accent, color: rs.colors.accent, fontFamily: FONTS[c.style.headingFont]?.cssVar }}>
          {c.couple.monogram?.trim() || coupleInitials(c.couple)}
        </div>
        <p className="mt-[6mm] text-[6mm]" style={{ color: rs.colors.muted }}>
          أهلاً بكم في حفل زفاف
        </p>
        <h1 className="mt-[2mm] text-[15mm] leading-tight" style={{ color: rs.colors.accent, fontFamily: FONTS[c.style.headingFont]?.cssVar }}>
          {coupleTitle(c.couple, "ar")}
        </h1>
        {main && <p className="mt-[3mm] text-[5mm]">{formatGregorian(main.startsAt, "ar")}</p>}
        <div className="mt-[10mm] w-[95mm] rounded-[4mm] bg-white p-[4mm] shadow-lg" dangerouslySetInnerHTML={{ __html: svg }} />
        <p className="mt-[8mm] text-[8mm] font-bold" style={{ color: rs.colors.accent, fontFamily: "var(--f-cairo)" }}>
          امسح الرمز لتسجيل حضورك
        </p>
        <p className="mt-[2mm] text-[4.5mm]" style={{ color: rs.colors.muted, fontFamily: "var(--f-cairo)" }}>
          افتح كاميرا الجوال ووجّهها نحو الرمز، ثم اكتب اسمك ورقم جوالك
        </p>
        <p className="mt-[5mm] text-[3.5mm]" dir="ltr" style={{ color: rs.colors.muted }}>
          {url.replace(/^https?:\/\//, "")}
        </p>
      </div>
    </div>
  );
}
