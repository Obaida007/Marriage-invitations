import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getInvitationByCheckinCode } from "@/lib/data";
import { selfCheckinWindow } from "@/lib/permissions";
import { coupleInitials, coupleTitle } from "@/lib/couple";
import { resolveStyle, styleVars } from "@/lib/themes";
import { FONTS } from "@/lib/fonts-meta";
import { SelfCheckinForm } from "@/components/checkin/SelfCheckinForm";

export const metadata: Metadata = { title: "تسجيل الحضور", robots: { index: false, follow: false } };

export default async function SelfCheckinPage(props: PageProps<"/c/[code]">) {
  const { code } = await props.params;
  const inv = await getInvitationByCheckinCode(code);
  if (!inv) notFound();
  const c = inv.content;
  const rs = resolveStyle(c.style);
  const title = coupleTitle(c.couple, "ar");
  const window = selfCheckinWindow(c);
  const style = {
    ...styleVars(rs),
    "--inv-card-text": rs.colors.text,
    "--inv-card-muted": rs.colors.muted,
    "--inv-heading": FONTS[c.style.headingFont]?.cssVar,
    "--inv-body": FONTS[c.style.bodyFont]?.cssVar,
  } as React.CSSProperties;

  return (
    <div dir="rtl" className="inv-root flex min-h-[100svh] flex-col items-center justify-center px-5 py-10" style={style}>
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-[4px] border-double border-inv-accent/70 font-heading text-2xl text-inv-accent">
            {c.couple.monogram?.trim() || coupleInitials(c.couple)}
          </div>
          <p className="mt-4 font-body text-inv-muted">حفل زفاف</p>
          <h1 className="font-heading text-4xl text-inv-accent">{title}</h1>
        </div>
        <div className="inv-card p-6">
          {!inv.selfCheckin ? (
            <p className="text-center font-body text-lg text-inv-muted">تسجيل الحضور الذاتي غير مفعّل، يرجى مراجعة الاستقبال.</p>
          ) : !window.open ? (
            <p className="text-center font-body text-lg text-inv-muted">
              {window.reason === "before" ? "يفتح تسجيل الحضور يوم الحفل. ننتظركم بشوق 🤍" : "انتهت المناسبة، شكراً لحضوركم 🤍"}
            </p>
          ) : (
            <>
              <h2 className="mb-5 text-center font-heading text-2xl text-inv-accent">تسجيل الحضور</h2>
              <SelfCheckinForm code={code} title={title} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
