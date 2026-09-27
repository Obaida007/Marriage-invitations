"use client";

import { useEffect, useState } from "react";
import {
  ANIMATIONS,
  COLOR_KEYS,
  COVER_SHAPES,
  FONT_IDS,
  FRAMES,
  HEADING_SCALES,
  ORNAMENTS,
  PARTICLES,
  PATTERNS,
  RADII,
  type ColorKey,
  type InvitationContent,
  type InvitationStyle,
} from "@/lib/invitation-schema";
import { THEME_LIST, THEMES, resolveStyle } from "@/lib/themes";
import { FONTS } from "@/lib/fonts-meta";
import { defaultStyle } from "@/lib/defaults";
import { Divider, Pattern } from "@/components/invitation/Ornaments";
import { Field, Panel, Toggle } from "@/components/ui/controls";

type Patch = (fn: (c: InvitationContent) => void) => void;

const COLOR_LABELS: Record<ColorKey, string> = {
  bg: "الخلفية",
  surface: "البطاقات",
  text: "النص",
  muted: "النص الثانوي",
  accent: "اللون الرئيسي",
  border: "الحدود",
  envelope: "الظرف",
  seal: "ختم الظرف",
};

const ORNAMENT_LABELS: Record<(typeof ORNAMENTS)[number], string> = {
  arabesque: "أرابيسك",
  floral: "زهور",
  geometric: "هندسي",
  leaves: "أوراق",
  stars: "نجمة إسلامية",
  line: "خط بسيط",
  dunes: "كثبان",
};
const PATTERN_LABELS: Record<(typeof PATTERNS)[number], string> = {
  none: "بدون",
  arabesque: "أرابيسك",
  floral: "زهور",
  geometric: "هندسي",
  stars: "نجوم",
  lattice: "مشربية",
  dots: "نقاط",
};
const RADIUS_LABELS = { sharp: "حادة", soft: "ناعمة", round: "دائرية" } as const;
const FRAME_LABELS = { none: "بدون", single: "إطار مفرد", double: "إطار مزدوج" } as const;
const COVER_LABELS = { arch: "قوس", circle: "دائرة", rounded: "مستطيل ناعم", square: "مربع" } as const;
const PARTICLE_LABELS = { petals: "بتلات", hearts: "قلوب", stars: "نجوم", sparkles: "لمعان" } as const;
const SCALE_LABELS = { sm: "صغير", md: "متوسط", lg: "كبير", xl: "كبير جداً" } as const;
const ANIMATION_LABELS = { fade: "ظهور تدريجي", slide: "انزلاق", zoom: "تكبير", none: "بدون حركة" } as const;

interface SavedTheme {
  id: string;
  name: string;
  style: InvitationStyle;
}
const SAVED_KEY = "dawati:custom-themes";

function loadSaved(): SavedTheme[] {
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY) ?? "[]");
  } catch {
    return [];
  }
}

/** Keeps motion/hero preferences when switching the look. */
function withKeptPrefs(next: InvitationStyle, prev: InvitationStyle): InvitationStyle {
  return { ...next, envelope: prev.envelope, petals: prev.petals, heroTone: prev.heroTone, heroOverlay: prev.heroOverlay, heroBlur: prev.heroBlur };
}

export function DesignPanel({ content, patch, defaultOpen }: { content: InvitationContent; patch: Patch; defaultOpen?: boolean }) {
  const { style } = content;
  const rs = resolveStyle(style);
  const [saved, setSaved] = useState<SavedTheme[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- saved templates live in this device's storage
    setSaved(loadSaved());
  }, []);

  function persist(list: SavedTheme[]) {
    setSaved(list);
    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify(list));
    } catch {}
  }

  function saveCurrent() {
    const name = prompt("اسم القالب الخاص:", `قالبي ${saved.length + 1}`)?.trim();
    if (!name) return;
    persist([...saved, { id: Date.now().toString(36), name: name.slice(0, 40), style: structuredClone(style) }]);
  }

  const set = <K extends keyof InvitationStyle>(key: K, value: InvitationStyle[K]) => patch((c) => void (c.style[key] = value));
  const isCustomized =
    Object.values(style.colors ?? {}).some(Boolean) || !!style.accent || !!(style.ornament || style.pattern || style.radius || style.frame || style.coverShape || style.particle);

  // Mini swatch of the current accent for ornament previews.
  const previewVars = { "--inv-accent": rs.colors.accent } as React.CSSProperties;

  return (
    <>
      <Panel title="القالب" icon="🎨" defaultOpen={defaultOpen}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {THEME_LIST.map((th) => (
            <button
              key={th.id}
              type="button"
              onClick={() => patch((c) => void (c.style = withKeptPrefs(defaultStyle(th.id), c.style)))}
              className={`overflow-hidden rounded-2xl border-2 text-start transition ${style.theme === th.id ? "border-brand ring-4 ring-brand/15" : "border-line hover:border-stone-300"}`}
            >
              <div className="relative flex h-16 items-center justify-center gap-1.5 overflow-hidden" style={{ background: th.colors.bg, color: th.colors.accent }}>
                <span className="relative text-2xl" style={{ fontFamily: FONTS[th.headingFont].cssVar }}>
                  م و س
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 bg-white px-3 py-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold">{th.name}</div>
                  <div className="truncate text-[11px] text-stone-500">{th.description}</div>
                </div>
                <div className="flex shrink-0 -space-x-1.5 rtl:space-x-reverse">
                  {[th.colors.accent, th.colors.seal, th.colors.bg].map((col, i) => (
                    <span key={i} className="h-3.5 w-3.5 rounded-full ring-1 ring-black/10" style={{ background: col }} />
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-dashed border-line p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-bold">⭐ قوالبي الخاصة</span>
            <button type="button" className="btn-ghost px-3 py-1.5 text-xs" onClick={saveCurrent}>
              حفظ التصميم الحالي كقالب
            </button>
          </div>
          {saved.length === 0 ? (
            <p className="mt-2 text-xs text-stone-500">خصّص الألوان والأشكال ثم احفظها كقالب لاستخدامه في دعوات أخرى على هذا الجهاز.</p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {saved.map((sv) => {
                const r = resolveStyle(sv.style);
                return (
                  <span key={sv.id} className="inline-flex items-center gap-1 rounded-full border border-line bg-white py-1 ps-1 pe-2 text-sm">
                    <button type="button" className="inline-flex items-center gap-1.5" onClick={() => patch((c) => void (c.style = withKeptPrefs(structuredClone(sv.style), c.style)))}>
                      <span className="h-5 w-5 rounded-full ring-2 ring-white" style={{ background: `linear-gradient(135deg, ${r.colors.bg} 50%, ${r.colors.accent} 50%)` }} />
                      {sv.name}
                    </button>
                    <button type="button" className="text-stone-400 hover:text-red-600" aria-label="حذف" onClick={() => persist(saved.filter((x) => x.id !== sv.id))}>
                      ✕
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </div>
        {isCustomized && (
          <button type="button" className="text-sm text-stone-500 underline" onClick={() => patch((c) => void (c.style = withKeptPrefs({ ...defaultStyle(c.style.theme), headingFont: c.style.headingFont, bodyFont: c.style.bodyFont, headingScale: c.style.headingScale, animation: c.style.animation, corners: c.style.corners }, c.style)))}>
            ↺ إرجاع الألوان والأشكال إلى أصل القالب
          </button>
        )}
      </Panel>

      <Panel title="الألوان" icon="🖌️">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {COLOR_KEYS.map((k) => {
            const custom = k === "accent" ? style.colors?.accent || style.accent : style.colors?.[k];
            const value = k === "accent" ? rs.colors.accent : rs.colors[k];
            return (
              <label key={k} className={`relative cursor-pointer rounded-xl border p-2 text-center transition ${custom ? "border-brand bg-soft/60" : "border-line bg-white hover:border-stone-300"}`}>
                <input
                  type="color"
                  className="mx-auto block h-10 w-full cursor-pointer rounded-lg border-0 bg-transparent p-0"
                  value={value}
                  onChange={(e) =>
                    patch((c) => {
                      c.style.colors = { ...c.style.colors, [k]: e.target.value };
                      if (k === "accent") c.style.accent = "";
                    })
                  }
                />
                <span className="mt-1 block text-xs font-semibold text-stone-700">{COLOR_LABELS[k]}</span>
                {custom && (
                  <button
                    type="button"
                    className="absolute end-1 top-1 rounded-full bg-white/90 px-1.5 text-[10px] text-stone-500 shadow hover:text-red-600"
                    title="إرجاع لون القالب"
                    onClick={(e) => {
                      e.preventDefault();
                      patch((c) => {
                        const next = { ...c.style.colors };
                        delete next[k];
                        c.style.colors = next;
                        if (k === "accent") c.style.accent = "";
                      });
                    }}
                  >
                    ↺
                  </button>
                )}
              </label>
            );
          })}
        </div>
        <p className="text-xs text-stone-500">الألوان المعدّلة محاطة بإطار؛ اضغط ↺ لإرجاع لون القالب الأصلي.</p>
      </Panel>

      <Panel title="الأشكال والزخارف" icon="✨">
        <div>
          <span className="label">شكل الزخرفة (الفواصل والزوايا)</span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" style={previewVars}>
            {ORNAMENTS.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => set("ornament", o === rs.theme.ornament ? "" : o)}
                className={`rounded-xl border p-2 text-center text-xs font-semibold transition ${rs.ornament === o ? "border-brand bg-soft ring-2 ring-brand/15" : "border-line bg-white hover:border-stone-300"}`}
              >
                <Divider ornament={o} className="max-w-full" />
                {ORNAMENT_LABELS[o]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="label">نقشة الخلفية</span>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-7" style={previewVars}>
            {PATTERNS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => set("pattern", p === rs.theme.pattern ? "" : p)}
                className={`relative h-16 overflow-hidden rounded-xl border text-[11px] font-semibold transition ${rs.pattern === p ? "border-brand ring-2 ring-brand/15" : "border-line hover:border-stone-300"}`}
                style={{ background: rs.colors.bg, color: rs.colors.text }}
              >
                <Pattern pattern={p} opacity={0.35} />
                <span className="absolute inset-x-0 bottom-0 bg-white/85 py-0.5 text-stone-700">{PATTERN_LABELS[p]}</span>
              </button>
            ))}
          </div>
        </div>
        <Segmented label="زوايا البطاقات والأزرار" options={RADII} labels={RADIUS_LABELS} value={rs.radius} onChange={(v) => set("radius", v === rs.theme.radius ? "" : v)} />
        <Segmented label="إطار القسم الأول" options={FRAMES} labels={FRAME_LABELS} value={rs.frame} onChange={(v) => set("frame", v === rs.theme.frame ? "" : v)} />
        <Segmented label="شكل صورة الغلاف" options={COVER_SHAPES} labels={COVER_LABELS} value={rs.coverShape} onChange={(v) => set("coverShape", v === rs.theme.coverShape ? "" : v)} />
        <Toggle label="زخارف الزوايا" checked={style.corners !== false} onChange={(v) => set("corners", v)} />
      </Panel>

      <Panel title="الخطوط واللغة" icon="🔤">
        <div className="grid gap-4 sm:grid-cols-2">
          <FontSelect label="خط الأسماء والعناوين" value={style.headingFont} onChange={(v) => set("headingFont", v)} />
          <FontSelect label="خط النصوص" value={style.bodyFont} onChange={(v) => set("bodyFont", v)} />
        </div>
        <Segmented label="حجم أسماء العروسين" options={HEADING_SCALES} labels={SCALE_LABELS} value={style.headingScale ?? "md"} onChange={(v) => set("headingScale", v)} />
        <Field label="لغة الدعوة">
          <select
            className="input"
            value={content.locale}
            onChange={(e) =>
              patch((c) => {
                c.locale = e.target.value as "ar" | "en";
                const th = THEMES[c.style.theme];
                c.style.headingFont = c.locale === "en" ? "great-vibes" : th.headingFont;
                c.style.bodyFont = c.locale === "en" ? "cormorant" : th.bodyFont;
              })
            }
          >
            <option value="ar">العربية</option>
            <option value="en">English</option>
          </select>
        </Field>
      </Panel>

      <Panel title="الحركة والمؤثرات" icon="🎬">
        <Segmented label="حركة ظهور الأقسام" options={ANIMATIONS} labels={ANIMATION_LABELS} value={style.animation ?? "fade"} onChange={(v) => set("animation", v)} />
        <Toggle label="ظرف افتتاحي متحرك" hint="يفتح الضيف الظرف ليرى الدعوة، ويبدأ تشغيل الموسيقى" checked={style.envelope} onChange={(v) => set("envelope", v)} />
        <Toggle label="عناصر متساقطة" checked={style.petals} onChange={(v) => set("petals", v)} />
        {style.petals && <Segmented label="شكل العناصر المتساقطة" options={PARTICLES} labels={PARTICLE_LABELS} value={rs.particle} onChange={(v) => set("particle", v === rs.theme.particle ? "" : v)} />}
      </Panel>
    </>
  );
}

export function Segmented<T extends string>({
  label,
  options,
  labels,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  labels: Record<T, string>;
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <span className="label">{label}</span>
      <div className="flex flex-wrap gap-1 rounded-xl bg-soft p-1" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={o}
            type="button"
            role="radio"
            aria-checked={value === o}
            onClick={() => onChange(o)}
            className={`min-w-16 flex-1 rounded-lg px-2 py-1.5 text-sm font-semibold transition ${value === o ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-800"}`}
          >
            {labels[o]}
          </button>
        ))}
      </div>
    </div>
  );
}

function FontSelect({ label, value, onChange }: { label: string; value: (typeof FONT_IDS)[number]; onChange: (v: (typeof FONT_IDS)[number]) => void }) {
  return (
    <Field label={label}>
      <select className="input text-lg" style={{ fontFamily: FONTS[value].cssVar }} value={value} onChange={(e) => onChange(e.target.value as (typeof FONT_IDS)[number])}>
        {FONT_IDS.map((f) => (
          <option key={f} value={f} style={{ fontFamily: FONTS[f].cssVar }}>
            {FONTS[f].label} — {FONTS[f].sample}
          </option>
        ))}
      </select>
    </Field>
  );
}
