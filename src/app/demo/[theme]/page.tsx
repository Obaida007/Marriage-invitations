import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import { InvitationView } from "@/components/invitation/InvitationView";
import { defaultContent } from "@/lib/defaults";
import { THEMES } from "@/lib/themes";
import { THEME_IDS, type ThemeId } from "@/lib/invitation-schema";

export const metadata: Metadata = { title: "معاينة قالب", robots: { index: false } };

export default async function DemoPage(props: PageProps<"/demo/[theme]">) {
  await connection();
  const { theme } = await props.params;
  if (!(THEME_IDS as readonly string[]).includes(theme)) notFound();
  const th = THEMES[theme as ThemeId];
  const content = defaultContent();
  content.style = { ...content.style, theme: th.id, headingFont: th.headingFont, bodyFont: th.bodyFont };
  content.media.gallery = [];

  return (
    <>
      <InvitationView
        content={content}
        slug="demo"
        demo
        guest={{ token: "DEMO2026", name: "أ. عبدالرحمن", status: "pending", attendingCount: 0, maxCompanions: 2 }}
        wishes={[
          { id: "1", name: "أم فهد", message: "ألف مبروك، بارك الله لكما وبارك عليكما وجمع بينكما في خير 🤍" },
          { id: "2", name: "خالد", message: "الله يتمم على خير ويجعلها ليلة العمر" },
        ]}
      />
      <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
        <Link href={`/create?theme=${th.id}`} className="btn-primary rounded-full px-6 py-3 shadow-xl">
          ✨ استخدم هذا القالب لدعوتك
        </Link>
      </div>
    </>
  );
}
