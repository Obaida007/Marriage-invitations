"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  EVENT_ICONS,
  OPENING_PRESETS,
  invitationContentSchema,
  type InvitationContent,
  type InvitationEvent,
} from "@/lib/invitation-schema";
import { OPENING_LABELS } from "@/lib/i18n";
import { suggestSlug } from "@/lib/slug";
import { uploadFile } from "@/lib/upload";
import { InvitationView } from "@/components/invitation/InvitationView";
import { Icon } from "@/components/invitation/Ornaments";
import { Field, Panel, Spinner, Toggle } from "@/components/ui/controls";
import { DesignPanel, Segmented } from "./DesignPanel";
import { SectionsPanel } from "./SectionsPanel";

const TIMEZONES: [string, string][] = [
  ["Asia/Riyadh", "السعودية"],
  ["Asia/Dubai", "الإمارات"],
  ["Asia/Kuwait", "الكويت"],
  ["Asia/Qatar", "قطر"],
  ["Asia/Bahrain", "البحرين"],
  ["Asia/Muscat", "عُمان"],
  ["Asia/Aden", "اليمن"],
  ["Asia/Baghdad", "العراق"],
  ["Asia/Amman", "الأردن"],
  ["Asia/Damascus", "سوريا"],
  ["Asia/Beirut", "لبنان"],
  ["Asia/Hebron", "فلسطين"],
  ["Africa/Cairo", "مصر"],
  ["Africa/Khartoum", "السودان"],
  ["Africa/Tripoli", "ليبيا"],
  ["Africa/Tunis", "تونس"],
  ["Africa/Algiers", "الجزائر"],
  ["Africa/Casablanca", "المغرب"],
  ["Africa/Nouakchott", "موريتانيا"],
  ["Europe/Istanbul", "تركيا"],
  ["Europe/London", "المملكة المتحدة"],
  ["Europe/Berlin", "أوروبا الوسطى"],
  ["America/New_York", "أمريكا (شرق)"],
  ["America/Los_Angeles", "أمريكا (غرب)"],
];

const ICON_LABELS: Record<(typeof EVENT_ICONS)[number], string> = {
  rings: "خواتم",
  hall: "قاعة",
  dinner: "عشاء",
  music: "موسيقى",
  camera: "تصوير",
  cake: "كعكة",
  car: "زفة",
  heart: "قلب",
  moon: "ليل",
};

const GROOM_TITLES = ["المهندس", "الدكتور", "الطبيب", "الأستاذ", "المحامي", "الصيدلي", "الطيار", "الضابط", "النقيب", "الملازم", "الشيخ", "المستشار", "الأستاذ الدكتور", "م.", "د.", "أ."];
const BRIDE_TITLES = ["المهندسة", "الدكتورة", "الطبيبة", "الأستاذة", "المحامية", "الصيدلانية", "المعلمة", "المستشارة", "الأستاذة الدكتورة", "م.", "د.", "أ."];

const uid = () => Math.random().toString(36).slice(2, 10);

/** Extracts coordinates from common Google Maps URL shapes. */
function coordsFromMapUrl(url: string): [number, number] | null {
  const m = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ?? url.match(/[?&](?:q|query|ll)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/) ?? url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  return m ? [Number(m[1]), Number(m[2])] : null;
}

export function InvitationEditor({
  mode,
  initial,
  id,
  initialSlug = "",
  onSaved,
}: {
  mode: "create" | "edit";
  initial: InvitationContent;
  id?: string;
  initialSlug?: string;
  onSaved?: (slug: string, content: InvitationContent) => void;
}) {
  const router = useRouter();
  const [content, setContent] = useState<InvitationContent>(initial);
  const [slug, setSlug] = useState(initialSlug);
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [slugState, setSlugState] = useState<{ checking: boolean; available?: boolean; reason?: string }>({ checking: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");
  const [dirty, setDirty] = useState(false);

  const patch = (fn: (c: InvitationContent) => void) => {
    setContent((prev) => {
      const next = structuredClone(prev);
      fn(next);
      return next;
    });
    setDirty(true);
  };

  // Suggest a URL from the couple's names until the user edits it.
  const autoSlug = useMemo(() => suggestSlug(content.couple.groomName, content.couple.brideName), [content.couple.groomName, content.couple.brideName]);
  const effectiveSlug = slugTouched ? slug : autoSlug;

  useEffect(() => {
    if (!effectiveSlug) return;
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setSlugState({ checking: true });
      try {
        const qs = new URLSearchParams({ slug: effectiveSlug, ...(id ? { id } : {}) });
        const res = await fetch(`/api/slug?${qs}`, { signal: ctrl.signal });
        const data = await res.json();
        setSlugState({ checking: false, available: data.available, reason: data.reason });
      } catch {
        /* aborted */
      }
    }, 400);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [effectiveSlug, id]);

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  async function save() {
    setError("");
    const parsed = invitationContentSchema.safeParse(content);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      setError(`${issue.message}${issue.path.length ? ` (${issue.path.join(" › ")})` : ""}`);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(mode === "create" ? "/api/invitations" : `/api/invitations/${id}`, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug: slugTouched ? slug : autoSlug, content: parsed.data }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "تعذر الحفظ");
      setDirty(false);
      if (mode === "create") {
        try {
          sessionStorage.setItem(`mk:${data.id}`, data.manageKey);
        } catch {}
        router.push(`/manage/${data.id}?welcome=1`);
      } else {
        setSlug(data.slug);
        setSavedAt(Date.now());
        onSaved?.(data.slug, parsed.data);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر الحفظ");
    } finally {
      setSaving(false);
    }
  }

  const { couple, texts, events, program, notes, media, style, features, rsvp, contact } = content;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px] xl:grid-cols-[minmax(0,1fr)_460px]">
      {/* Mobile view switcher */}
      <div className="sticky top-2 z-30 flex gap-1 rounded-2xl border border-line bg-white/90 p-1 shadow-sm backdrop-blur lg:hidden">
        {(["edit", "preview"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setMobileView(v)}
            className={`flex-1 rounded-xl py-2 text-sm font-bold ${mobileView === v ? "bg-brand text-white" : "text-stone-600"}`}
          >
            {v === "edit" ? "✏️ التعديل" : "👁️ المعاينة"}
          </button>
        ))}
      </div>

      {/* ---------- Form ---------- */}
      <div className={`space-y-4 ${mobileView === "preview" ? "hidden lg:block" : ""}`}>
        <Panel title="العروسان" icon="💍" defaultOpen>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="اسم العريس">
              <input className="input" value={couple.groomName} maxLength={60} onChange={(e) => patch((c) => void (c.couple.groomName = e.target.value))} />
            </Field>
            <Field label="اسم العروس">
              <input className="input" value={couple.brideName} maxLength={60} onChange={(e) => patch((c) => void (c.couple.brideName = e.target.value))} />
            </Field>
            <Field label="نسب العريس (اختياري)" hint="مثال: نجل السيد / أحمد عبدالله">
              <input className="input" value={couple.groomFamily} maxLength={120} onChange={(e) => patch((c) => void (c.couple.groomFamily = e.target.value))} />
            </Field>
            <Field label="نسب العروس (اختياري)" hint="مثال: كريمة السيد / خالد إبراهيم">
              <input className="input" value={couple.brideFamily} maxLength={120} onChange={(e) => patch((c) => void (c.couple.brideFamily = e.target.value))} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="لقب العريس (اختياري)" hint="اختر من القائمة أو اكتب لقباً مخصصاً">
              <input className="input" list="groom-titles" placeholder="بدون لقب" value={couple.groomTitle} maxLength={40} onChange={(e) => patch((c) => void (c.couple.groomTitle = e.target.value))} />
            </Field>
            <Field label="لقب العروس (اختياري)">
              <input className="input" list="bride-titles" placeholder="بدون لقب" value={couple.brideTitle} maxLength={40} onChange={(e) => patch((c) => void (c.couple.brideTitle = e.target.value))} />
            </Field>
          </div>
          <datalist id="groom-titles">
            {GROOM_TITLES.map((x) => (
              <option key={x} value={x} />
            ))}
          </datalist>
          <datalist id="bride-titles">
            {BRIDE_TITLES.map((x) => (
              <option key={x} value={x} />
            ))}
          </datalist>
          {(couple.groomTitle || couple.brideTitle) && (
            <Toggle label="اللقب بجانب الاسم" hint="بدلاً من إظهاره في سطر صغير فوق الاسم" checked={couple.titlesInline} onChange={(v) => patch((c) => void (c.couple.titlesInline = v))} />
          )}
          <Field label="المونوغرام / نص ختم الظرف (اختياري)" hint="يظهر على ختم الشمع وفي تخطيط «مونوغرام». يُترك فارغاً لاستخدام الحرفين الأولين تلقائياً">
            <input className="input" placeholder={`${couple.groomName.charAt(0)} ${couple.brideName.charAt(0)}`} value={couple.monogram} maxLength={8} onChange={(e) => patch((c) => void (c.couple.monogram = e.target.value))} />
          </Field>
          <Toggle label="إظهار اسم العروس أولاً" checked={couple.brideFirst} onChange={(v) => patch((c) => void (c.couple.brideFirst = v))} />
          <Toggle label="إخفاء اسم العروس" hint="يُعرض الحرف الأول فقط، تقديراً للخصوصية" checked={couple.hideBrideName} onChange={(v) => patch((c) => void (c.couple.hideBrideName = v))} />
        </Panel>

        <Panel title="نص الدعوة" icon="📜">
          <Field label="الافتتاحية">
            <select className="input" value={texts.opening} onChange={(e) => patch((c) => void (c.texts.opening = e.target.value as InvitationContent["texts"]["opening"]))}>
              {OPENING_PRESETS.map((o) => (
                <option key={o} value={o}>
                  {OPENING_LABELS[o]}
                </option>
              ))}
            </select>
          </Field>
          {texts.opening === "custom" && (
            <Field label="نص الافتتاحية">
              <textarea className="input min-h-20" value={texts.customOpening} maxLength={300} onChange={(e) => patch((c) => void (c.texts.customOpening = e.target.value))} />
            </Field>
          )}
          <Field label="الداعون" hint="مثال: يتشرف آل فلان وآل فلان">
            <input className="input" value={texts.hosts} maxLength={300} onChange={(e) => patch((c) => void (c.texts.hosts = e.target.value))} />
          </Field>
          <Field label="نص الدعوة">
            <textarea className="input min-h-20" value={texts.invitationLine} maxLength={500} onChange={(e) => patch((c) => void (c.texts.invitationLine = e.target.value))} />
          </Field>
          <Field label="الختام">
            <input className="input" value={texts.closing} maxLength={300} onChange={(e) => patch((c) => void (c.texts.closing = e.target.value))} />
          </Field>
        </Panel>

        <Panel title="الحفلات والمواعيد" icon="📅" defaultOpen={mode === "create"}>
          <Field label="المنطقة الزمنية لمكان الحفل" hint="يُعرض الوقت دائماً بتوقيت مكان الحفل، ويُحسب العد التنازلي بدقة للضيوف في أي دولة">
            <select className="input" value={content.timezone} onChange={(e) => patch((c) => void (c.timezone = e.target.value))}>
              {TIMEZONES.map(([tz, label]) => (
                <option key={tz} value={tz}>
                  {label} ({tz})
                </option>
              ))}
            </select>
          </Field>
          {events.map((ev, i) => (
            <EventEditor
              key={ev.id}
              event={ev}
              index={i}
              canRemove={events.length > 1}
              onChange={(fn) => patch((c) => fn(c.events[i]))}
              onRemove={() => patch((c) => void c.events.splice(i, 1))}
            />
          ))}
          {events.length < 6 && (
            <button
              type="button"
              className="btn-ghost w-full border-dashed"
              onClick={() =>
                patch((c) =>
                  void c.events.push({
                    ...structuredClone(c.events[c.events.length - 1]),
                    id: uid(),
                    title: c.events.length === 1 ? "حفل النساء" : "حفل جديد",
                  }),
                )
              }
            >
              + إضافة حفل آخر (مثل: حفل الرجال / النساء / الملكة / الحناء)
            </button>
          )}
        </Panel>

        <Panel title="برنامج الحفل" icon="🕰️">
          {program.map((p, i) => (
            <div key={p.id} className="flex items-center gap-2">
              <select
                className="input w-24 shrink-0 px-2"
                value={p.icon}
                aria-label="أيقونة"
                onChange={(e) => patch((c) => void (c.program[i].icon = e.target.value as (typeof EVENT_ICONS)[number]))}
              >
                {EVENT_ICONS.map((ic) => (
                  <option key={ic} value={ic}>
                    {ICON_LABELS[ic]}
                  </option>
                ))}
              </select>
              <input className="input w-24 shrink-0" placeholder="الوقت" value={p.time} maxLength={20} onChange={(e) => patch((c) => void (c.program[i].time = e.target.value))} />
              <input className="input" placeholder="الفقرة" value={p.title} maxLength={100} onChange={(e) => patch((c) => void (c.program[i].title = e.target.value))} />
              <button type="button" className="shrink-0 p-2 text-stone-400 hover:text-red-600" aria-label="حذف" onClick={() => patch((c) => void c.program.splice(i, 1))}>
                ✕
              </button>
            </div>
          ))}
          {program.length < 15 && (
            <button type="button" className="btn-ghost w-full border-dashed" onClick={() => patch((c) => void c.program.push({ id: uid(), time: "", title: "فقرة جديدة", icon: "heart" }))}>
              + إضافة فقرة
            </button>
          )}
        </Panel>

        <DesignPanel content={content} patch={patch} defaultOpen={mode === "create"} />

        <Panel title="الصور والموسيقى" icon="🖼️" defaultOpen={mode === "create"}>
          <div className="space-y-4 rounded-2xl border border-line p-4">
            <div>
              <span className="text-sm font-bold text-stone-800">🌄 خلفية الدعوة (صورة أو فيديو)</span>
              <p className="text-xs text-stone-500">صورة القاعة أو الورود أو فيديو قصير. الفيديو يعمل صامتاً ومتكرراً، والصورة تظهر ريثما يُحمَّل.</p>
            </div>
            <Field label="صورة الخلفية">
              <MediaInput kind="image" maxSize={2000} value={media.heroBackground} onChange={(v) => patch((c) => void (c.media.heroBackground = v))} />
            </Field>
            <Field label="فيديو الخلفية (اختياري)" hint="MP4 أو WebM حتى 20 ميغابايت، ويُفضّل أقل من 10 ثوانٍ وبدقة 720p. للملفات الأكبر ضع رابطاً مباشراً لملف الفيديو.">
              <MediaInput kind="video" value={media.backgroundVideo} onChange={(v) => patch((c) => void (c.media.backgroundVideo = v))} />
            </Field>
            {(media.heroBackground || media.backgroundVideo) && (
              <div className="space-y-4 rounded-2xl bg-soft/60 p-4">
                <Segmented
                  label="أين تظهر الخلفية؟"
                  options={["hero", "page"] as const}
                  labels={{ hero: "القسم الأول فقط", page: "كل صفحة الدعوة" }}
                  value={style.backgroundScope ?? "hero"}
                  onChange={(v) => patch((c) => void (c.style.backgroundScope = v))}
                />
                <Segmented
                  label="لون النص فوق الخلفية"
                  options={["auto", "light", "dark"] as const}
                  labels={{ auto: "ألوان القالب", light: "نص فاتح (طبقة داكنة)", dark: "نص داكن (طبقة فاتحة)" }}
                  value={style.heroTone}
                  onChange={(v) => patch((c) => void (c.style.heroTone = v))}
                />
                <Field label={`شفافية الطبقة فوق الخلفية: ${style.heroOverlay}%`} hint="زِدها إذا كان النص غير واضح">
                  <input type="range" min={0} max={95} step={5} className="w-full accent-[var(--brand)]" value={style.heroOverlay} onChange={(e) => patch((c) => void (c.style.heroOverlay = Number(e.target.value)))} />
                </Field>
                <Field label={`تمويه الخلفية: ${style.heroBlur}px`}>
                  <input type="range" min={0} max={12} step={1} className="w-full accent-[var(--brand)]" value={style.heroBlur} onChange={(e) => patch((c) => void (c.style.heroBlur = Number(e.target.value)))} />
                </Field>
                {style.backgroundScope === "page" && (
                  <p className="text-xs text-stone-500">💡 مع خلفية لكل الصفحة، جرّب نمط البطاقات «زجاجي» من قسم «التخطيط» لمظهر أنيق.</p>
                )}
              </div>
            )}
          </div>
          <Field label="صورة الغلاف (اختياري)" hint="صورة داخل إطار (قوس أو دائرة…) فوق الأسماء">
            <MediaInput kind="image" value={media.coverImage} onChange={(v) => patch((c) => void (c.media.coverImage = v))} />
          </Field>
          <div>
            <span className="label">معرض الصور ({media.gallery.length}/12)</span>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {media.gallery.map((src, i) => (
                <div key={i} className="group relative aspect-square overflow-hidden rounded-xl border border-line">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    className="absolute end-1 top-1 rounded-full bg-black/60 px-2 text-xs text-white"
                    onClick={() => patch((c) => void c.media.gallery.splice(i, 1))}
                    aria-label="حذف"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {media.gallery.length < 12 && (
                <MultiImageUpload
                  remaining={12 - media.gallery.length}
                  onUploaded={(urls) => patch((c) => void c.media.gallery.push(...urls))}
                />
              )}
            </div>
          </div>
          <Field label="موسيقى الخلفية" hint="MP3 حتى 8 ميغابايت أو رابط مباشر لملف صوتي. تبدأ عند فتح الظرف (المتصفحات تمنع التشغيل التلقائي).">
            <MediaInput kind="audio" value={media.musicUrl} onChange={(v) => patch((c) => {
              c.media.musicUrl = v;
              if (v) c.features.music = true;
            })} />
          </Field>
        </Panel>

        <Panel title="تأكيد الحضور والخصائص" icon="⚙️">
          <div className="grid gap-x-6 sm:grid-cols-2">
            <Toggle label="العد التنازلي" checked={features.countdown} onChange={(v) => patch((c) => void (c.features.countdown = v))} />
            <Toggle label="التاريخ الهجري" checked={features.hijriDate} onChange={(v) => patch((c) => void (c.features.hijriDate = v))} />
            <Toggle label="خريطة الموقع" checked={features.map} onChange={(v) => patch((c) => void (c.features.map = v))} />
            <Toggle label="إضافة للتقويم" checked={features.calendar} onChange={(v) => patch((c) => void (c.features.calendar = v))} />
            <Toggle label="برنامج الحفل" checked={features.program} onChange={(v) => patch((c) => void (c.features.program = v))} />
            <Toggle label="معرض الصور" checked={features.gallery} onChange={(v) => patch((c) => void (c.features.gallery = v))} />
            <Toggle label="دفتر التهاني" checked={features.wishes} onChange={(v) => patch((c) => void (c.features.wishes = v))} />
            <Toggle label="الموسيقى" checked={features.music} onChange={(v) => patch((c) => void (c.features.music = v))} />
            <Toggle label="تأكيد الحضور" checked={features.rsvp} onChange={(v) => patch((c) => void (c.features.rsvp = v))} />
            <Toggle label="بطاقة دخول QR" hint="تظهر للضيف بعد تأكيد حضوره" checked={features.qrPass} onChange={(v) => patch((c) => void (c.features.qrPass = v))} />
          </div>
          {features.rsvp && (
            <div className="space-y-3 rounded-2xl bg-soft/60 p-4">
              <Toggle
                label="السماح لأي شخص يملك الرابط العام بتأكيد الحضور"
                hint="عند الإيقاف، يستطيع التأكيد فقط الضيوف المضافون إلى القائمة عبر روابطهم الشخصية"
                checked={rsvp.openRsvp}
                onChange={(v) => patch((c) => void (c.rsvp.openRsvp = v))}
              />
              <Toggle label="حقل ملاحظة في النموذج" checked={rsvp.askNote} onChange={(v) => patch((c) => void (c.rsvp.askNote = v))} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="آخر موعد للتأكيد" hint="اتركه فارغاً ليُغلق عند بدء الحفل">
                  <input type="date" className="input" value={rsvp.deadline} onChange={(e) => patch((c) => void (c.rsvp.deadline = e.target.value))} />
                </Field>
                <Field label="عدد المرافقين المسموح (للرابط العام)">
                  <input
                    type="number"
                    min={0}
                    max={20}
                    className="input"
                    value={rsvp.defaultCompanions}
                    onChange={(e) => patch((c) => void (c.rsvp.defaultCompanions = Math.max(0, Math.min(20, Number(e.target.value) || 0))))}
                  />
                </Field>
              </div>
            </div>
          )}
          <div>
            <span className="label">ملاحظات للضيوف</span>
            <div className="space-y-2">
              {notes.map((n, i) => (
                <div key={i} className="flex gap-2">
                  <input className="input" value={n} maxLength={160} onChange={(e) => patch((c) => void (c.notes[i] = e.target.value))} />
                  <button type="button" className="p-2 text-stone-400 hover:text-red-600" aria-label="حذف" onClick={() => patch((c) => void c.notes.splice(i, 1))}>
                    ✕
                  </button>
                </div>
              ))}
              {notes.length < 10 && (
                <button type="button" className="btn-ghost w-full border-dashed" onClick={() => patch((c) => void c.notes.push("ملاحظة جديدة"))}>
                  + إضافة ملاحظة
                </button>
              )}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="اسم جهة التواصل (اختياري)">
              <input className="input" value={contact.name} maxLength={60} onChange={(e) => patch((c) => void (c.contact.name = e.target.value))} />
            </Field>
            <Field label="رقم واتساب للتواصل" hint="بالصيغة الدولية، مثال: 9665xxxxxxxx">
              <input className="input" dir="ltr" inputMode="tel" value={contact.phone} maxLength={30} onChange={(e) => patch((c) => void (c.contact.phone = e.target.value))} />
            </Field>
          </div>
        </Panel>

        <SectionsPanel content={content} patch={patch} />

        <Panel title="رابط الدعوة" icon="🔗" defaultOpen={mode === "create"}>
          <Field label="الرابط المخصص" hint="أحرف إنجليزية صغيرة وأرقام وشرطات">
            <div className="flex items-stretch overflow-hidden rounded-xl border border-line bg-white focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/15" dir="ltr">
              <span className="flex items-center bg-soft px-3 text-sm text-stone-500">/i/</span>
              <input
                className="w-full px-3 py-2.5 text-[15px] outline-none"
                value={effectiveSlug}
                maxLength={48}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
                  setDirty(true);
                }}
              />
            </div>
          </Field>
          <p className={`text-sm ${slugState.available === false ? "text-red-600" : "text-emerald-700"}`}>
            {slugState.checking ? "جارٍ التحقق…" : slugState.available === false ? slugState.reason : slugState.available ? "✓ الرابط متاح" : ""}
            {mode === "create" && slugState.available === false && !slugTouched && " — سنضيف لاحقة تلقائياً"}
          </p>
        </Panel>

        {/* Save bar */}
        <div className="sticky bottom-3 z-20 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-white/95 p-3 shadow-lg backdrop-blur">
          <button type="button" className="btn-primary min-w-40 flex-1 sm:flex-none" onClick={save} disabled={saving}>
            {saving && <Spinner />}
            {mode === "create" ? "إنشاء الدعوة ✨" : "حفظ التعديلات"}
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {!error && savedAt && !dirty && <p className="text-sm text-emerald-700">✓ تم الحفظ</p>}
          {!error && dirty && mode === "edit" && <p className="text-sm text-amber-700">لديك تعديلات غير محفوظة</p>}
        </div>
      </div>

      {/* ---------- Live preview ---------- */}
      <div className={`${mobileView === "edit" ? "hidden lg:block" : ""}`}>
        <div className="lg:sticky lg:top-4">
          <div className="mx-auto w-full max-w-[420px] rounded-[2.75rem] border-[10px] border-stone-900 bg-stone-900 shadow-2xl">
            <div className="relative h-[calc(100svh-7rem)] max-h-[860px] min-h-[560px] overflow-y-auto overflow-x-hidden rounded-[2rem] bg-white [scrollbar-width:thin]">
              <InvitationView content={content} slug={effectiveSlug || "preview"} preview />
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-stone-500">معاينة مباشرة — تتحدث مع كل تعديل</p>
        </div>
      </div>
    </div>
  );
}

function EventEditor({
  event,
  index,
  canRemove,
  onChange,
  onRemove,
}: {
  event: InvitationEvent;
  index: number;
  canRemove: boolean;
  onChange: (fn: (e: InvitationEvent) => void) => void;
  onRemove: () => void;
}) {
  return (
    <div className="space-y-4 rounded-2xl border border-line bg-soft/40 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-brand-dark">الحفل {index + 1}</span>
        {canRemove && (
          <button type="button" className="text-sm text-red-600 hover:underline" onClick={onRemove}>
            حذف
          </button>
        )}
      </div>
      <Field label="عنوان الحفل">
        <input className="input" value={event.title} maxLength={80} onChange={(e) => onChange((ev) => void (ev.title = e.target.value))} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="يبدأ">
          <input type="datetime-local" className="input" value={event.startsAt} onChange={(e) => e.target.value && onChange((ev) => void (ev.startsAt = e.target.value.slice(0, 16)))} />
        </Field>
        <Field label="ينتهي (اختياري)">
          <input type="datetime-local" className="input" value={event.endsAt} onChange={(e) => onChange((ev) => void (ev.endsAt = e.target.value.slice(0, 16)))} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="اسم القاعة / المكان">
          <input className="input" value={event.venueName} maxLength={120} onChange={(e) => onChange((ev) => void (ev.venueName = e.target.value))} />
        </Field>
        <Field label="العنوان">
          <input className="input" value={event.address} maxLength={300} onChange={(e) => onChange((ev) => void (ev.address = e.target.value))} />
        </Field>
      </div>
      <Field label="رابط الموقع على خرائط Google (اختياري)" hint="الصق رابط المكان من خرائط Google، وسنستخرج الإحداثيات تلقائياً إن وُجدت">
        <input
          className="input"
          dir="ltr"
          placeholder="https://maps.google.com/..."
          value={event.mapUrl}
          onChange={(e) => {
            const url = e.target.value.trim();
            const coords = coordsFromMapUrl(url);
            onChange((ev) => {
              ev.mapUrl = url;
              ev.lat = coords?.[0] ?? null;
              ev.lng = coords?.[1] ?? null;
            });
          }}
        />
      </Field>
      <Field label="ملاحظة خاصة بهذا الحفل (اختياري)">
        <input className="input" value={event.note} maxLength={200} onChange={(e) => onChange((ev) => void (ev.note = e.target.value))} />
      </Field>
    </div>
  );
}

function MediaInput({ kind, value, onChange, maxSize }: { kind: "image" | "audio" | "video"; value: string; onChange: (v: string) => void; maxSize?: number }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  async function onFile(file?: File) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      onChange(await uploadFile(file, kind, maxSize));
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل الرفع");
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input className="input" dir="ltr" placeholder="https://…" value={value} onChange={(e) => onChange(e.target.value.trim())} />
        <button type="button" className="btn-ghost shrink-0" onClick={() => ref.current?.click()} disabled={busy}>
          {busy ? <Spinner /> : <Icon name={kind === "audio" ? "music" : kind === "video" ? "play" : "camera"} className="h-4 w-4" />}
          رفع
        </button>
        <input ref={ref} type="file" hidden accept={kind === "image" ? "image/*" : kind === "video" ? "video/mp4,video/webm,video/quicktime" : "audio/*"} onChange={(e) => onFile(e.target.files?.[0])} />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {value && kind === "image" && (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="h-16 w-16 rounded-xl border border-line object-cover" />
          <button type="button" className="text-sm text-red-600 hover:underline" onClick={() => onChange("")}>
            إزالة
          </button>
        </div>
      )}
      {value && kind === "video" && (
        <div className="flex items-center gap-3">
          <video src={value} muted loop autoPlay playsInline className="h-20 w-32 rounded-xl border border-line bg-black object-cover" />
          <button type="button" className="text-sm text-red-600 hover:underline" onClick={() => onChange("")}>
            إزالة
          </button>
        </div>
      )}
      {value && kind === "audio" && (
        <div className="flex items-center gap-3">
          <audio src={value} controls preload="none" className="h-10 w-full" />
          <button type="button" className="shrink-0 text-sm text-red-600 hover:underline" onClick={() => onChange("")}>
            إزالة
          </button>
        </div>
      )}
    </div>
  );
}

function MultiImageUpload({ remaining, onUploaded }: { remaining: number; onUploaded: (urls: string[]) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError("");
    const urls: string[] = [];
    try {
      for (const f of Array.from(files).slice(0, remaining)) urls.push(await uploadFile(f, "image"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل الرفع");
    } finally {
      if (urls.length) onUploaded(urls);
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={busy}
        className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-line text-sm text-stone-500 hover:border-brand hover:text-brand"
      >
        {busy ? <Spinner className="h-6 w-6" /> : <span className="text-2xl">+</span>}
        {busy ? "جارٍ الرفع" : "إضافة صور"}
      </button>
      <input ref={ref} type="file" hidden multiple accept="image/*" onChange={(e) => onFiles(e.target.files)} />
      {error && <p className="col-span-full text-sm text-red-600">{error}</p>}
    </>
  );
}
