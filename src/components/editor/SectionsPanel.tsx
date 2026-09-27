"use client";

import { SECTION_IDS, type InvitationContent, type SectionId } from "@/lib/invitation-schema";
import { t } from "@/lib/i18n";
import { Panel } from "@/components/ui/controls";

type Patch = (fn: (c: InvitationContent) => void) => void;
type FeatureKey = keyof InvitationContent["features"];

const META: Record<SectionId, { label: string; icon: string; feature?: FeatureKey; defaultTitle: (d: ReturnType<typeof t>) => string }> = {
  countdown: { label: "العد التنازلي", icon: "⏳", feature: "countdown", defaultTitle: (d) => d.countdownTitle },
  events: { label: "تفاصيل الحفلات", icon: "📅", defaultTitle: (d) => d.eventDetails },
  program: { label: "برنامج الحفل", icon: "🕰️", feature: "program", defaultTitle: (d) => d.program },
  gallery: { label: "معرض الصور", icon: "🖼️", feature: "gallery", defaultTitle: (d) => d.gallery },
  notes: { label: "الملاحظات", icon: "📝", defaultTitle: (d) => d.notes },
  rsvp: { label: "تأكيد الحضور", icon: "✅", feature: "rsvp", defaultTitle: (d) => d.rsvpTitle },
  wishes: { label: "دفتر التهاني", icon: "💌", feature: "wishes", defaultTitle: (d) => d.wishesTitle },
};

export function SectionsPanel({ content, patch }: { content: InvitationContent; patch: Patch }) {
  const d = t(content.locale);
  const order = [...new Set([...(content.sections ?? []), ...SECTION_IDS])];

  function move(i: number, dir: -1 | 1) {
    patch((c) => {
      const list = [...new Set([...(c.sections ?? []), ...SECTION_IDS])];
      const j = i + dir;
      if (j < 0 || j >= list.length) return;
      [list[i], list[j]] = [list[j], list[i]];
      c.sections = list;
    });
  }

  return (
    <Panel title="ترتيب الأقسام وعناوينها" icon="🧩">
      <p className="text-sm text-stone-600">رتّب أقسام الدعوة كما تحب، وأظهر أو أخفِ أي قسم، وغيّر عنوانه. القسم الأول (الأسماء والتاريخ) يبقى دائماً في الأعلى.</p>
      <ol className="space-y-2">
        {order.map((id, i) => {
          const m = META[id];
          const visible = m.feature ? content.features[m.feature] : true;
          return (
            <li key={id} className={`flex items-center gap-2 rounded-xl border border-line bg-white p-2 ${visible ? "" : "opacity-60"}`}>
              <div className="flex flex-col">
                <button type="button" className="px-1.5 text-stone-400 hover:text-stone-800 disabled:opacity-30" disabled={i === 0} onClick={() => move(i, -1)} aria-label="تحريك للأعلى">
                  ▲
                </button>
                <button type="button" className="px-1.5 text-stone-400 hover:text-stone-800 disabled:opacity-30" disabled={i === order.length - 1} onClick={() => move(i, 1)} aria-label="تحريك للأسفل">
                  ▼
                </button>
              </div>
              <span className="w-6 text-center text-lg">{m.icon}</span>
              <div className="min-w-0 flex-1">
                <span className="block text-xs font-semibold text-stone-500">{m.label}</span>
                <input
                  className="w-full rounded-lg border border-transparent bg-soft/60 px-2 py-1 text-sm outline-none focus:border-brand focus:bg-white"
                  placeholder={m.defaultTitle(d)}
                  value={content.texts.sectionTitles?.[id] ?? ""}
                  maxLength={60}
                  onChange={(e) => patch((c) => void (c.texts.sectionTitles = { ...c.texts.sectionTitles, [id]: e.target.value }))}
                  aria-label={`عنوان قسم ${m.label}`}
                />
              </div>
              {m.feature && (
                <button
                  type="button"
                  className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-bold ${visible ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-500"}`}
                  onClick={() => patch((c) => void (c.features[m.feature!] = !visible))}
                >
                  {visible ? "ظاهر" : "مخفي"}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}
