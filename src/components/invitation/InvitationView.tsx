"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { SECTION_IDS, type InvitationContent, type SectionId } from "@/lib/invitation-schema";
import { luminance, resolveStyle, styleVars, type CoverShape } from "@/lib/themes";
import { FONTS } from "@/lib/fonts-meta";
import { OPENING_TEXT, t } from "@/lib/i18n";
import { formatGregorian, formatNumber, zonedToDate } from "@/lib/dates";
import { isRsvpClosed } from "@/lib/rsvp";
import { coupleInitials, coupleTitle } from "@/lib/couple";
import { Corner, Divider, Icon, Pattern } from "./Ornaments";
import { Reveal, RevealContext } from "./Reveal";
import { Backdrop } from "./Backdrop";
import { DateBlock } from "./DateBlock";
import { Petals } from "./Petals";
import { Countdown } from "./Countdown";
import { Intro } from "./Intro";
import { MusicButton } from "./MusicButton";
import { EventCard } from "./EventCard";
import { RsvpSection, type PublicGuest } from "./RsvpSection";
import { WishesSection, type PublicWish } from "./WishesSection";
import { GuestPass } from "./GuestPass";

export interface InvitationViewProps {
  content: InvitationContent;
  slug: string;
  guest?: PublicGuest | null;
  wishes?: PublicWish[];
  /** Editor preview: no network calls, no envelope, no fixed overlays. */
  preview?: boolean;
  /** Public demo: full experience (envelope, music) but nothing is saved. */
  demo?: boolean;
  origin?: string;
}

export function InvitationView({ content, slug, guest: initialGuest = null, wishes = [], preview = false, demo = false, origin = "" }: InvitationViewProps) {
  const offline = preview || demo;
  const { couple, texts, events, program, notes, media, style, features, rsvp, locale } = content;
  const d = t(locale);
  const rs = resolveStyle(style);
  const ornament = rs.ornament;
  // Curtains read as velvet in the darker of the envelope/seal colors.
  const velvet = luminance(rs.colors.seal) < luminance(rs.colors.envelope) ? rs.colors.seal : rs.colors.envelope;
  const [opened, setOpened] = useState(preview || !style.envelope);
  // Editor preview: replay the opening scene on request (see DesignPanel).
  const [replaying, setReplaying] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!preview) return;
    const onReplay = () => {
      rootRef.current?.parentElement?.scrollTo({ top: 0 });
      setReplaying(true);
    };
    window.addEventListener("dawati:replay-intro", onReplay);
    return () => window.removeEventListener("dawati:replay-intro", onReplay);
  }, [preview]);
  const [guest, setGuest] = useState<PublicGuest | null>(initialGuest);
  const [playing, setPlaying] = useState(false);
  const [shareMsg, setShareMsg] = useState("");
  const audioRef = useRef<HTMLAudioElement>(null);
  const musicOn = features.music && !!media.musicUrl;

  // Restore a public (non-listed) guest's RSVP from this device.
  useEffect(() => {
    if (offline || initialGuest) return;
    let token: string | null = null;
    try {
      token = localStorage.getItem(`inv:${slug}:guest`);
    } catch {}
    if (!token) return;
    fetch(`/api/rsvp?slug=${encodeURIComponent(slug)}&token=${encodeURIComponent(token)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data?.guest && setGuest(data.guest))
      .catch(() => {});
  }, [offline, initialGuest, slug]);

  // Count a real view (client-only, so link previews and prefetches don't count).
  useEffect(() => {
    if (offline) return;
    const key = `inv:${slug}:viewed`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {}
    fetch("/api/view", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug, guestToken: initialGuest?.token }),
      keepalive: true,
    }).catch(() => {});
  }, [offline, slug, initialGuest?.token]);

  const toggleMusic = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play().then(() => setPlaying(true), () => setPlaying(false));
    else {
      a.pause();
      setPlaying(false);
    }
  }, []);

  function handleOpen() {
    setOpened(true);
    window.scrollTo({ top: 0 });
    if (musicOn && audioRef.current) {
      audioRef.current.play().then(() => setPlaying(true), () => setPlaying(false));
    }
  }

  function handleGuest(g: PublicGuest) {
    setGuest(g);
    if (!initialGuest && !offline) {
      try {
        localStorage.setItem(`inv:${slug}:guest`, g.token);
      } catch {}
    }
  }

  const title = coupleTitle(couple, locale);
  const pageUrl = `${origin}/i/${slug}`;

  async function share() {
    const data = { title, text: `${d.share}: ${title}`, url: pageUrl };
    try {
      if (navigator.share) return await navigator.share(data);
      await navigator.clipboard.writeText(pageUrl);
      setShareMsg(d.copied);
      setTimeout(() => setShareMsg(""), 2500);
    } catch {}
  }

  const main = events[0];
  const target = main ? zonedToDate(main.startsAt, content.timezone).getTime() : 0;
  const rsvpClosed = isRsvpClosed(content);
  const opening = texts.opening === "custom" ? texts.customOpening : OPENING_TEXT[texts.opening];
  const gallery = media.gallery.filter(Boolean);
  const groom = { name: couple.groomName, title: couple.groomTitle, family: couple.groomFamily, hidden: false };
  const bride = { name: couple.brideName, title: couple.brideTitle, family: couple.brideFamily, hidden: couple.hideBrideName };
  const [first, second] = couple.brideFirst ? [bride, groom] : [groom, bride];

  const rootStyle = {
    ...styleVars(rs),
    // Cards keep the theme's text colors even when the page text is re-toned.
    "--inv-card-text": rs.colors.text,
    "--inv-card-muted": rs.colors.muted,
    "--inv-heading": FONTS[style.headingFont]?.cssVar,
    "--inv-body": FONTS[style.bodyFont]?.cssVar,
  } as React.CSSProperties;

  // Background image/video: overlay + text tone so the text stays readable.
  const hasBg = !!(media.heroBackground || media.backgroundVideo);
  const scope = style.backgroundScope ?? "hero";
  const tone = hasBg ? style.heroTone : "auto";
  const heroVars = (
    tone === "light"
      ? { "--inv-text": "#ffffff", "--inv-muted": "rgba(255,255,255,.82)" }
      : tone === "dark"
        ? { "--inv-text": "#1c1c1c", "--inv-muted": "rgba(28,28,28,.72)" }
        : {}
  ) as React.CSSProperties;
  const overlayColor = tone === "light" ? "#000000" : tone === "dark" ? "#ffffff" : rs.colors.bg;

  // Hero layout; layouts that need a photo fall back gracefully without one.
  const posterImage = rs.heroLayout === "poster" && !(hasBg && scope === "hero") ? media.coverImage : "";
  const splitImage = rs.heroLayout === "split" ? media.coverImage || (scope === "hero" ? "" : media.heroBackground) : "";
  const layout = rs.heroLayout === "split" && !splitImage ? "classic" : rs.heroLayout;
  const posterVars = (posterImage ? { "--inv-text": "#ffffff", "--inv-muted": "rgba(255,255,255,.85)" } : {}) as React.CSSProperties;
  const monogram = couple.monogram?.trim() || coupleInitials(couple);

  const openingLine = opening && <p className="mx-auto max-w-md font-amiri text-lg leading-loose text-inv-muted sm:text-xl">{opening}</p>;
  const greeting = guest && (
    <p className="mt-8 font-body text-lg text-inv-muted">
      {d.dear} <span className="font-heading text-2xl text-inv-text">{guest.name}</span>
      {guest.maxCompanions > 0 && (
        <span className="mt-1 block font-sans text-sm">
          ({formatNumber(guest.maxCompanions + 1, locale)} {d.guests})
        </span>
      )}
    </p>
  );
  const hostsBlock = (
    <>
      {texts.hosts && <p className="mt-8 font-body text-xl leading-relaxed">{texts.hosts}</p>}
      {texts.invitationLine && <p className="mx-auto mt-3 max-w-md font-body text-lg leading-relaxed text-inv-muted">{texts.invitationLine}</p>}
    </>
  );
  const nameScale = layout === "monogram" ? smaller(style.headingScale) : layout === "poster" ? larger(style.headingScale) : style.headingScale;
  const names = (
    <h1 className="font-heading leading-tight">
      <CoupleName person={first} inline={couple.titlesInline} scale={nameScale} />
      <span className="my-4 block text-3xl text-inv-accent">{d.weds}</span>
      <CoupleName person={second} inline={couple.titlesInline} scale={nameScale} />
    </h1>
  );
  const dateBlock = main && <DateBlock startsAt={main.startsAt} locale={locale} variant={rs.dateStyle} showHijri={features.hijriDate} />;
  const decorations = (
    <>
      {rs.frame !== "none" && (
        <div
          className={`pointer-events-none absolute inset-3 border-inv-accent/60 sm:inset-5 ${rs.frame === "double" ? "border-[5px] border-double" : "border"}`}
          style={{ borderRadius: "var(--inv-radius-sm)" }}
        />
      )}
      {style.corners !== false && (
        <>
          <Corner ornament={ornament} className="absolute start-3 top-3 rtl:-scale-x-100" />
          <Corner ornament={ornament} className="absolute end-3 top-3 ltr:-scale-x-100" />
          <Corner ornament={ornament} className="absolute bottom-3 start-3 -scale-y-100 rtl:scale-x-[-1]" />
          <Corner ornament={ornament} className="absolute bottom-3 end-3 -scale-y-100 ltr:-scale-x-100" />
        </>
      )}
    </>
  );

  const section = "mx-auto w-full max-w-xl px-5";
  const sectionTitle = (id: SectionId, fallback: string) => texts.sectionTitles?.[id]?.trim() || fallback;
  const order = [...new Set([...(content.sections ?? []), ...SECTION_IDS])];

  const sections: Record<SectionId, React.ReactNode> = {
    countdown: features.countdown && main && (
      <Reveal className={section}>
        <div className="inv-card p-6 text-center">
          <h2 className="mb-5 font-heading text-2xl text-inv-accent">{sectionTitle("countdown", d.countdownTitle)}</h2>
          <Countdown target={target} locale={locale} d={d} variant={rs.countdownStyle} />
        </div>
      </Reveal>
    ),
    events: (
      <section id="details" className={`${section} scroll-mt-6 space-y-6`}>
        <SectionTitle title={sectionTitle("events", d.eventDetails)} ornament={ornament} />
        {events.map((ev, i) => (
          <Reveal key={ev.id} delay={i * 0.05}>
            <EventCard
              event={ev}
              timezone={content.timezone}
              locale={locale}
              d={d}
              showHijri={features.hijriDate}
              showMap={features.map}
              showCalendar={features.calendar}
              calendarTitle={`${ev.title} - ${title}`}
              calendarDetails={pageUrl}
              icsUrl={`/i/${slug}/calendar?e=${encodeURIComponent(ev.id)}`}
            />
          </Reveal>
        ))}
      </section>
    ),
    program: features.program && program.length > 0 && (
      <section className={section}>
        <SectionTitle title={sectionTitle("program", d.program)} ornament={ornament} />
        <Reveal>
          <ol className="relative mt-6 space-y-5 before:absolute before:inset-y-2 before:start-[1.2rem] before:w-px before:bg-inv-border">
            {program.map((p) => (
              <li key={p.id} className="relative flex items-center gap-4">
                <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-inv-border bg-inv-surface text-inv-accent">
                  <Icon name={p.icon} />
                </span>
                <div className="inv-card flex flex-1 items-center justify-between gap-3 px-5 py-3">
                  <span className="font-body text-lg">{p.title}</span>
                  {p.time && <span className="shrink-0 font-sans text-sm font-bold text-inv-accent">{p.time}</span>}
                </div>
              </li>
            ))}
          </ol>
        </Reveal>
      </section>
    ),
    gallery: features.gallery && gallery.length > 0 && (
      <section className="mx-auto w-full max-w-3xl px-5">
        <SectionTitle title={sectionTitle("gallery", d.gallery)} ornament={ornament} />
        <Reveal>
          <div className="mt-6 columns-2 gap-3 sm:columns-3 [&>*]:mb-3">
            {gallery.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element -- user-provided URLs from any host
              <img key={i} src={src} alt="" loading="lazy" className="w-full break-inside-avoid rounded-[var(--inv-radius-sm)] border border-inv-border object-cover" />
            ))}
          </div>
        </Reveal>
      </section>
    ),
    notes: notes.length > 0 && (
      <Reveal className={section}>
        <div className="inv-card p-6">
          <h2 className="mb-4 text-center font-heading text-2xl text-inv-accent">{sectionTitle("notes", d.notes)}</h2>
          <ul className="space-y-2.5">
            {notes.map((n, i) => (
              <li key={i} className="flex items-start gap-3 font-body text-lg">
                <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rotate-45 bg-inv-accent" />
                {n}
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    ),
    rsvp: features.rsvp && (
      <section id="rsvp" className={`${section} scroll-mt-6`}>
        <Reveal>
          <div className="inv-card p-6 sm:p-8">
            <h2 className="text-center font-heading text-3xl text-inv-accent">{sectionTitle("rsvp", d.rsvpTitle)}</h2>
            <p className="mb-6 mt-1 text-center font-body text-lg text-inv-muted">{d.rsvpSubtitle}</p>
            <RsvpSection
              key={guest?.token ?? "anon"}
              slug={slug}
              guest={guest}
              onGuest={handleGuest}
              maxCompanions={rsvp.defaultCompanions}
              askNote={rsvp.askNote}
              closed={rsvpClosed}
              guestOnly={!rsvp.openRsvp}
              deadlineLabel={rsvp.deadline ? formatGregorian(`${rsvp.deadline}T00:00`, locale) : undefined}
              preview={offline}
              locale={locale}
              d={d}
            />
            {features.qrPass && guest?.status === "attending" && (
              <div className="mt-8">
                <GuestPass url={`${origin || (typeof window !== "undefined" ? window.location.origin : "")}/i/${slug}?g=${guest.token}`} token={guest.token} name={guest.name} count={guest.attendingCount} locale={locale} d={d} />
              </div>
            )}
          </div>
        </Reveal>
      </section>
    ),
    wishes: features.wishes && (
      <section className={section}>
        <Reveal>
          <div className="inv-card p-6 sm:p-8">
            <h2 className="text-center font-heading text-3xl text-inv-accent">{sectionTitle("wishes", d.wishesTitle)}</h2>
            <p className="mb-6 mt-1 text-center font-body text-lg text-inv-muted">{d.wishesSubtitle}</p>
            <WishesSection slug={slug} guestToken={guest?.token} defaultName={guest?.name} initial={wishes} preview={offline} d={d} />
          </div>
        </Reveal>
      </section>
    ),
  };

  return (
    <RevealContext.Provider value={style.animation ?? "fade"}>
      <div
        ref={rootRef}
        dir={d.dir}
        lang={locale}
        data-cards={rs.cardStyle}
        data-page-bg={hasBg && scope === "page" ? "" : undefined}
        className="inv-root relative min-h-full overflow-x-clip"
        style={{ ...rootStyle, ...(scope === "page" ? heroVars : {}) }}
      >
        {!preview && <Intro variant={rs.envelopeStyle} open={opened} onOpen={handleOpen} monogram={monogram} title={title} guestName={guest?.name} ornament={ornament} velvet={velvet} d={d} />}
        {preview && (
          <Intro variant={rs.envelopeStyle} open={!replaying} onOpen={() => setReplaying(false)} monogram={monogram} title={title} guestName={guest?.name} ornament={ornament} velvet={velvet} d={d} contained />
        )}
        {!preview && opened && style.petals && <Petals shape={rs.particle} />}
        {musicOn && <audio ref={audioRef} src={media.musicUrl} loop preload="none" />}
        {musicOn && !preview && opened && <MusicButton playing={playing} onToggle={toggleMusic} label={d.music} />}

        {hasBg && scope === "page" ? (
          <Backdrop image={media.heroBackground} video={media.backgroundVideo} overlayColor={overlayColor} overlay={style.heroOverlay ?? 55} blur={style.heroBlur ?? 0} scope="page" />
        ) : (
          <Pattern pattern={rs.pattern} opacity={rs.dark ? 0.09 : 0.07} />
        )}

        {/* ---------- Hero ---------- */}
        <header
          className={`relative flex ${preview ? "min-h-[var(--inv-viewport,700px)]" : "min-h-[100svh]"} flex-col items-center ${layout === "poster" ? "justify-between" : "justify-center"} overflow-hidden px-5 py-16 text-center`}
          style={{ ...(scope === "hero" ? heroVars : {}), ...posterVars }}
        >
          {hasBg && scope === "hero" && (
            <Backdrop image={media.heroBackground} video={media.backgroundVideo} overlayColor={overlayColor} overlay={style.heroOverlay ?? 55} blur={style.heroBlur ?? 0} scope="hero" />
          )}
          {posterImage && (
            <div className="pointer-events-none absolute inset-0" aria-hidden>
              {/* eslint-disable-next-line @next/next/no-img-element -- user-provided URLs from any host */}
              <img src={posterImage} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/80" />
            </div>
          )}

          {layout !== "card" && decorations}

          {layout === "poster" ? (
            <>
              <Reveal className="relative w-full max-w-xl text-inv-text">{openingLine}</Reveal>
              <Reveal className="relative w-full max-w-xl pb-10 text-inv-text">
                {greeting}
                {hostsBlock}
                <div className="mt-6">{names}</div>
                {dateBlock}
              </Reveal>
            </>
          ) : layout === "split" ? (
            <div className="relative grid w-full max-w-5xl items-center gap-10 md:grid-cols-2">
              <Reveal>
                <CoverImage src={splitImage} alt={title} shape={rs.coverShape} large />
              </Reveal>
              <Reveal className="text-inv-text">
                {openingLine}
                {greeting}
                {hostsBlock}
                <Divider ornament={ornament} className="my-8" />
                {names}
                {dateBlock}
              </Reveal>
            </div>
          ) : layout === "card" ? (
            <Reveal className="relative w-full max-w-lg">
              <div className="inv-card relative overflow-hidden px-6 py-14 text-inv-text sm:px-10">
                {decorations}
                <div className="relative">
                  {openingLine}
                  {media.coverImage && <CoverImage src={media.coverImage} alt={title} shape={rs.coverShape} />}
                  {greeting}
                  {hostsBlock}
                  <Divider ornament={ornament} className="my-8" />
                  {names}
                  {dateBlock}
                </div>
              </div>
            </Reveal>
          ) : layout === "monogram" ? (
            <Reveal className="relative w-full max-w-xl text-inv-text">
              {openingLine}
              <div className="relative mx-auto mt-8 flex h-44 w-44 items-center justify-center rounded-full border-[5px] border-double border-inv-accent/70 sm:h-52 sm:w-52">
                <div className="absolute inset-3 rounded-full border border-inv-accent/40" />
                <span className="font-heading text-5xl text-inv-accent sm:text-6xl">{monogram}</span>
              </div>
              {greeting}
              {hostsBlock}
              <Divider ornament={ornament} className="my-8" />
              {names}
              {dateBlock}
            </Reveal>
          ) : (
            <Reveal className="relative w-full max-w-xl text-inv-text">
              {openingLine}
              {media.coverImage && <CoverImage src={media.coverImage} alt={title} shape={rs.coverShape} />}
              {greeting}
              {hostsBlock}
              <Divider ornament={ornament} className="my-8" />
              {names}
              {dateBlock}
            </Reveal>
          )}

          {layout !== "poster" && (
            <a href="#details" className="float-soft absolute bottom-8 text-inv-accent" aria-label={d.eventDetails}>
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </a>
          )}
        </header>

        <main className="relative space-y-16 pb-24">
          {order.map((id) => sections[id] && <div key={id}>{sections[id]}</div>)}

          {/* ---------- Closing ---------- */}
          <Reveal className={`${section} text-center`}>
            <Divider ornament={ornament} />
            {texts.closing && <p className="mt-6 font-body text-xl leading-relaxed">{texts.closing}</p>}
            <p className="mt-6 font-heading text-4xl text-inv-accent">{title}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              <button type="button" onClick={share} className="inv-btn-outline">
                <Icon name="share" className="h-4 w-4" /> {shareMsg || d.share}
              </button>
              {content.contact.phone && (
                <a href={`https://wa.me/${content.contact.phone.replace(/[^\d]/g, "")}`} target="_blank" rel="noopener noreferrer" className="inv-btn-outline">
                  <Icon name="phone" className="h-4 w-4" /> {d.contact}
                  {content.contact.name && `: ${content.contact.name}`}
                </a>
              )}
            </div>
          </Reveal>
        </main>

        <footer className="relative pb-8 text-center font-sans text-xs text-inv-muted">
          {d.madeWith}{" "}
          <Link href="/" className="underline decoration-dotted">
            {locale === "ar" ? "دعوتي" : "Da'wati"}
          </Link>
        </footer>
      </div>
    </RevealContext.Provider>
  );
}

const SCALE_ORDER = ["sm", "md", "lg", "xl"] as const;
const smaller = (s: keyof typeof NAME_SIZES = "md") => SCALE_ORDER[Math.max(0, SCALE_ORDER.indexOf(s) - 1)];
const larger = (s: keyof typeof NAME_SIZES = "md") => SCALE_ORDER[Math.min(3, SCALE_ORDER.indexOf(s) + 1)];

const NAME_SIZES = {
  sm: "text-4xl sm:text-5xl",
  md: "text-5xl sm:text-6xl",
  lg: "text-6xl sm:text-7xl",
  xl: "text-7xl sm:text-8xl",
} as const;

function CoupleName({
  person,
  inline,
  scale = "md",
}: {
  person: { name: string; title: string; family: string; hidden: boolean };
  inline: boolean;
  scale?: keyof typeof NAME_SIZES;
}) {
  const name = person.hidden ? `${person.name.trim().charAt(0)}.` : person.name;
  const title = person.title.trim();
  return (
    <>
      {title && !inline && <span className="mb-1 block font-body text-xl text-inv-muted">{title}</span>}
      <span className={`inv-shimmer block ${NAME_SIZES[scale]}`}>
        {title && inline && <span className="text-[0.55em]">{title} </span>}
        {name}
      </span>
      {person.family && <span className="mt-2 block font-body text-base text-inv-muted">{person.family}</span>}
    </>
  );
}

const COVER_CLASSES: Record<CoverShape, { frame: string; img: string }> = {
  arch: { frame: "rounded-t-full w-52 sm:w-60", img: "aspect-[3/4]" },
  circle: { frame: "rounded-full w-52 sm:w-60", img: "aspect-square" },
  rounded: { frame: "rounded-[var(--inv-radius)] w-56 sm:w-64", img: "aspect-[4/5]" },
  square: { frame: "rounded-none w-56 sm:w-64", img: "aspect-[4/5]" },
};

function CoverImage({ src, alt, shape, large }: { src: string; alt: string; shape: CoverShape; large?: boolean }) {
  const c = COVER_CLASSES[shape] ?? COVER_CLASSES.arch;
  return (
    <div className={`mx-auto overflow-hidden border-4 border-inv-surface shadow-xl ring-1 ring-inv-accent/40 ${c.frame} ${large ? "!w-full max-w-sm" : "mt-8"}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- user-provided URLs from any host */}
      <img src={src} alt={alt} className={`${c.img} w-full object-cover`} />
    </div>
  );
}

function SectionTitle({ title, ornament }: { title: string; ornament: Parameters<typeof Divider>[0]["ornament"] }) {
  return (
    <div className="text-center">
      <h2 className="font-heading text-3xl text-inv-accent sm:text-4xl">{title}</h2>
      <Divider ornament={ornament} className="mt-2" />
    </div>
  );
}
