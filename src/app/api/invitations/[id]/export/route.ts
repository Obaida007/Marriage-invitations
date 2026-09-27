import type { NextRequest } from "next/server";
import { requireAccess } from "@/lib/api";
import { listGuests } from "@/lib/data";

const STATUS = { pending: "بانتظار الرد", attending: "سيحضر", declined: "معتذر" } as const;
const SIDE = { groom: "أهل العريس", bride: "أهل العروس", both: "مشترك" } as const;

function csvCell(v: unknown) {
  let s = v == null ? "" : String(v);
  // Neutralize spreadsheet formula injection.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET(req: NextRequest, ctx: RouteContext<"/api/invitations/[id]/export">) {
  const { id } = await ctx.params;
  const auth = await requireAccess(id, "view");
  if (!auth.ok) return auth.response;
  const list = await listGuests(id);
  const origin = req.nextUrl.origin;
  const SOURCE = { list: "القائمة", public: "الرابط العام", walkin: "عند الباب" } as const;
  const header = ["الاسم", "الجوال", "المصدر", "الجهة", "الحالة", "عدد الحضور", "المرافقين المسموح", "ملاحظة", "فتح الدعوة", "تسجيل الدخول", "الرابط الشخصي"];
  const lines = list.map((g) =>
    [
      g.name,
      g.phone,
      SOURCE[g.source],
      SIDE[g.side],
      STATUS[g.status],
      g.attendingCount,
      g.maxCompanions,
      g.note,
      g.openedAt ? g.openedAt.toISOString() : "",
      g.checkedInAt ? g.checkedInAt.toISOString() : "",
      `${origin}/i/${auth.inv.slug}?g=${g.token}`,
    ]
      .map(csvCell)
      .join(","),
  );
  // BOM so Excel opens Arabic text correctly.
  const csv = "﻿" + [header.map(csvCell).join(","), ...lines].join("\r\n");
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="guests-${auth.inv.slug}.csv"`,
    },
  });
}
