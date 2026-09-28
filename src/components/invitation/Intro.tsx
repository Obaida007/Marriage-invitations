"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { Dict } from "@/lib/i18n";
import type { IntroStyle, Ornament } from "@/lib/themes";
import { Divider, Pattern } from "./Ornaments";

interface IntroProps {
  variant: IntroStyle;
  open: boolean;
  onOpen: () => void;
  monogram: string;
  title: string;
  guestName?: string;
  ornament: Ornament;
  d: Dict;
  /** Render inside a positioned parent (editor preview) instead of full-screen. */
  contained?: boolean;
  /** Deep theme color for curtain fabric and gate wood (the darker of envelope/seal). */
  velvet?: string;
}

/** How long each scene's own exit takes before the overlay fades away. */
const EXIT_DELAY: Record<IntroStyle, number> = { classic: 1.1, royal: 1.1, floral: 1.1, gate: 1.15, curtain: 1.2 };

/**
 * Opening screen. Tapping it plays the scene's opening animation, reveals the
 * invitation and (being a user gesture) lets background music start.
 */
export function Intro(props: IntroProps) {
  const { variant, open, onOpen, contained, d } = props;
  const reduce = useReducedMotion();
  const seeThrough = variant === "gate" || variant === "curtain";

  return (
    <AnimatePresence>
      {!open && (
        <motion.div
          key={variant}
          className={`${contained ? "absolute inset-x-0 top-0 h-[var(--inv-viewport,700px)]" : "fixed inset-0"} z-50 overflow-hidden`}
          exit={{ opacity: 0, transition: { duration: reduce ? 0.2 : 0.6, delay: reduce ? 0 : EXIT_DELAY[variant] } }}
        >
          <div
            role="button"
            tabIndex={0}
            onClick={onOpen}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onOpen())}
            className="group absolute inset-0 cursor-pointer outline-none"
            aria-label={d.openInvitation}
          >
            {!seeThrough && <SceneBackground ornament={props.ornament} />}
            {variant === "gate" ? <GateScene {...props} /> : variant === "curtain" ? <CurtainScene {...props} /> : <EnvelopeScene {...props} />}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SceneBackground({ ornament }: { ornament: Ornament }) {
  return (
    <div className="absolute inset-0 bg-inv-bg">
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 45%, var(--inv-surface) 0%, transparent 65%)" }} />
      <Pattern pattern={ornament === "floral" || ornament === "leaves" ? "floral" : ornament === "stars" ? "stars" : "geometric"} opacity={0.06} />
    </div>
  );
}

function TapHint({ label, light }: { label: string; light?: boolean }) {
  return (
    <motion.span
      className={`relative inline-flex items-center gap-2 font-sans text-sm tracking-wide ${light ? "text-white/90" : "text-inv-muted"}`}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-inv-accent opacity-60" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-inv-accent" />
      </span>
      {label}
    </motion.span>
  );
}

// ---------------------------------------------------------------------------
// Envelopes (classic / royal / floral)
// ---------------------------------------------------------------------------

/** Irregular wax-seal outline (deterministic, so SSR and client agree). */
const SEAL_PATH = (() => {
  const pts = Array.from({ length: 28 }, (_, i) => {
    const a = (i / 28) * Math.PI * 2;
    const r = 47 + [2.5, -1.5, 1, -2.5, 2, -1][i % 6];
    return `${(50 + r * Math.cos(a)).toFixed(1)},${(50 + r * Math.sin(a)).toFixed(1)}`;
  });
  return `M${pts.join("L")}Z`;
})();

function WaxSeal({ monogram, gold }: { monogram: string; gold?: boolean }) {
  const id = gold ? "seal-gold" : "seal-wax";
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full drop-shadow-[0_6px_10px_rgba(0,0,0,.35)]" aria-hidden>
      <defs>
        <radialGradient id={id} cx="38%" cy="32%" r="75%">
          {gold ? (
            <>
              <stop offset="0%" stopColor="color-mix(in srgb, var(--inv-accent) 35%, white)" />
              <stop offset="45%" stopColor="var(--inv-accent)" />
              <stop offset="100%" stopColor="color-mix(in srgb, var(--inv-accent) 55%, black)" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="color-mix(in srgb, var(--inv-seal) 70%, white)" />
              <stop offset="55%" stopColor="var(--inv-seal)" />
              <stop offset="100%" stopColor="color-mix(in srgb, var(--inv-seal) 60%, black)" />
            </>
          )}
        </radialGradient>
      </defs>
      <path d={SEAL_PATH} fill={`url(#${id})`} />
      <circle cx="50" cy="50" r="33" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="1.2" />
      <circle cx="50" cy="50" r="30" fill="none" stroke="rgba(0,0,0,.25)" strokeWidth="1" />
      <text
        x="50"
        y="51"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={monogram.length > 4 ? 15 : 20}
        fill={gold ? "color-mix(in srgb, var(--inv-accent) 40%, black)" : "rgba(255,255,255,.92)"}
        style={{ fontFamily: "var(--inv-heading)", filter: "drop-shadow(0 1px 0 rgba(0,0,0,.35))" }}
      >
        {monogram}
      </text>
    </svg>
  );
}

function FlowerCluster() {
  const petal = (cx: number, cy: number, r: number, color: string) => (
    <g>
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx={cx} cy={cy - r * 0.55} rx={r * 0.42} ry={r * 0.6} fill={color} transform={`rotate(${a} ${cx} ${cy})`} />
      ))}
      <circle cx={cx} cy={cy} r={r * 0.28} fill="color-mix(in srgb, var(--inv-accent) 60%, #f5d98b)" />
    </g>
  );
  return (
    <svg viewBox="0 0 120 80" className="h-full w-full drop-shadow-[0_4px_8px_rgba(0,0,0,.25)]" aria-hidden>
      <path d="M20 52c15-8 30-10 40-4M100 52c-15-8-30-10-40-4" stroke="color-mix(in srgb, var(--inv-accent) 55%, #3d6b3d)" strokeWidth="2.5" fill="none" />
      <ellipse cx="26" cy="46" rx="10" ry="5" fill="color-mix(in srgb, var(--inv-accent) 35%, #4f7d4f)" transform="rotate(-25 26 46)" />
      <ellipse cx="94" cy="46" rx="10" ry="5" fill="color-mix(in srgb, var(--inv-accent) 35%, #4f7d4f)" transform="rotate(25 94 46)" />
      {petal(42, 42, 16, "color-mix(in srgb, var(--inv-seal) 55%, white)")}
      {petal(78, 42, 16, "color-mix(in srgb, var(--inv-seal) 55%, white)")}
      {petal(60, 36, 21, "color-mix(in srgb, var(--inv-seal) 80%, white)")}
    </svg>
  );
}

function EnvelopeScene({ variant, monogram, title, guestName, ornament, d }: IntroProps) {
  const royal = variant === "royal";
  const floral = variant === "floral";
  const paper = royal
    ? "linear-gradient(160deg, color-mix(in srgb, var(--inv-envelope) 88%, black), color-mix(in srgb, var(--inv-envelope) 70%, black))"
    : "linear-gradient(160deg, color-mix(in srgb, var(--inv-envelope) 96%, white), color-mix(in srgb, var(--inv-envelope) 88%, black))";
  const liner = floral
    ? "radial-gradient(circle at 25% 30%, color-mix(in srgb, var(--inv-seal) 35%, transparent) 0 6px, transparent 7px) 0 0/28px 28px, radial-gradient(circle at 75% 70%, color-mix(in srgb, var(--inv-accent) 35%, transparent) 0 4px, transparent 5px) 0 0/28px 28px, var(--inv-surface)"
    : "repeating-linear-gradient(45deg, color-mix(in srgb, var(--inv-accent) 30%, transparent) 0 2px, transparent 2px 12px), repeating-linear-gradient(-45deg, color-mix(in srgb, var(--inv-accent) 30%, transparent) 0 2px, transparent 2px 12px), color-mix(in srgb, var(--inv-accent) 12%, var(--inv-surface))";
  const foil = royal ? "0 0 0 1px color-mix(in srgb, var(--inv-accent) 70%, transparent) inset, 0 0 0 5px transparent inset, 0 0 0 6px color-mix(in srgb, var(--inv-accent) 45%, transparent) inset" : undefined;
  const textColor = royal ? "var(--inv-accent)" : "color-mix(in srgb, var(--inv-text) 80%, var(--inv-envelope))";

  return (
    <div className="relative flex h-full flex-col items-center justify-center gap-7 px-6">
      <motion.div className="text-center" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.7 }} exit={{ opacity: 0, y: -20, transition: { duration: 0.3 } }}>
        <p className="font-body text-lg text-inv-muted">{d.weddingInvitation}</p>
        <p className="font-heading text-3xl text-inv-accent">{title}</p>
      </motion.div>

      <motion.div
        className="relative [perspective:1400px]"
        style={{ width: "min(86vw, 360px)", aspectRatio: "36 / 25" }}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: [0, -6, 0] }}
        transition={{ opacity: { duration: 0.6 }, scale: { duration: 0.6 }, y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.6 } }}
        exit={{ y: 60, transition: { duration: 0.8, delay: 0.5 } }}
      >
        {/* back + liner */}
        <div className="absolute inset-0 overflow-hidden rounded-[6px] shadow-[0_25px_50px_-12px_rgba(0,0,0,.45)]" style={{ background: paper }}>
          <div className="absolute inset-x-0 top-0 h-[56%]" style={{ background: liner, clipPath: "polygon(0 0, 100% 0, 50% 100%)" }} />
        </div>

        {/* the invitation card inside */}
        <motion.div
          className="absolute inset-x-[7%] top-[5%] bottom-[7%] flex flex-col items-center justify-center rounded-[4px] border border-inv-border bg-inv-surface shadow-md"
          style={{ zIndex: 2 }}
          initial={{ y: 0, scale: 1 }}
          exit={{ y: "-62%", scale: 1.06 }}
          transition={{ duration: 0.8, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="font-heading text-2xl text-inv-accent">{monogram}</span>
          <Divider ornament={ornament} className="h-5! w-28!" />
          <span className="font-body text-xs text-inv-muted">{d.weddingInvitation}</span>
        </motion.div>

        {/* front pocket with side folds for depth */}
        <div className="absolute inset-0 overflow-hidden rounded-[6px]" style={{ zIndex: 3, clipPath: "polygon(0 0, 50% 54%, 100% 0, 100% 100%, 0 100%)" }}>
          <div className="absolute inset-0" style={{ background: paper, boxShadow: foil }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(0,0,0,.10), transparent 30%, transparent 70%, rgba(0,0,0,.10))" }} />
          <div className="absolute inset-0" style={{ background: "rgba(255,255,255,.07)", clipPath: "polygon(0 100%, 50% 50%, 100% 100%)" }} />
          {royal && <Pattern pattern="arabesque" opacity={0.12} />}
          {floral && (
            <motion.div className="absolute inset-y-0 start-[20%] w-[9%]" style={{ background: "linear-gradient(90deg, color-mix(in srgb, var(--inv-accent) 80%, black), var(--inv-accent), color-mix(in srgb, var(--inv-accent) 80%, black))" }} exit={{ opacity: 0, transition: { duration: 0.3 } }} />
          )}
          {guestName ? (
            <div className="absolute inset-x-0 bottom-[5%] text-center" style={{ color: textColor }}>
              <span className="block font-body text-sm opacity-80">{d.toHonor}</span>
              <span className="block truncate px-6 font-heading text-xl">{guestName}</span>
            </div>
          ) : (
            royal && (
              <div className="absolute inset-x-0 bottom-[12%] flex justify-center" style={{ color: "var(--inv-accent)" }}>
                <Divider ornament={ornament} className="h-5! w-32!" />
              </div>
            )
          )}
        </div>

        {/* flap: front face + liner on its back, flips open in 3D */}
        <motion.div
          className="absolute inset-x-0 top-0 h-[57%] origin-top [transform-style:preserve-3d]"
          style={{ zIndex: 4 }}
          initial={{ rotateX: 0, zIndex: 4 }}
          exit={{ rotateX: 180, zIndex: 1 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.4, 0, 0.2, 1] }}
        >
          <div
            className="absolute inset-0 [backface-visibility:hidden]"
            style={{ background: paper, clipPath: "polygon(0 0, 100% 0, 50% 100%)", filter: "drop-shadow(0 4px 4px rgba(0,0,0,.25))", boxShadow: foil }}
          >
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(255,255,255,.10), rgba(0,0,0,.08))" }} />
          </div>
          <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateX(180deg)]" style={{ background: liner, clipPath: "polygon(0 0, 100% 0, 50% 100%)" }} />
        </motion.div>

        {/* seal / flowers at the tip of the flap */}
        <motion.div
          className={`absolute left-1/2 -translate-x-1/2 -translate-y-1/2 transition-transform group-hover:scale-105 ${floral ? "top-[52%] h-[30%] w-[38%]" : "top-[54%] h-[26%] w-[19%]"}`}
          style={{ zIndex: 5 }}
          exit={{ scale: 0.2, rotate: floral ? 0 : 25, opacity: 0, transition: { duration: 0.3 } }}
        >
          {floral ? <FlowerCluster /> : <WaxSeal monogram={monogram} gold={royal} />}
        </motion.div>
      </motion.div>

      <TapHint label={d.tapToOpen} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Andalusian gate: two arched doors swing open to reveal the invitation
// ---------------------------------------------------------------------------

function Door({ side, ornament, wood }: { side: "left" | "right"; ornament: Ornament; wood: string }) {
  const isLeft = side === "left";
  return (
    <motion.div
      className={`absolute inset-y-0 w-1/2 ${isLeft ? "left-0 origin-left" : "right-0 origin-right"} [transform-style:preserve-3d]`}
      initial={{ rotateY: 0 }}
      exit={{ rotateY: isLeft ? -105 : 105 }}
      transition={{ duration: 1.4, ease: [0.45, 0, 0.2, 1] }}
    >
      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          background: `linear-gradient(90deg, color-mix(in srgb, ${wood} 75%, black), color-mix(in srgb, ${wood} 92%, black) 50%, color-mix(in srgb, ${wood} 70%, black))`,
          boxShadow: isLeft ? "inset -8px 0 18px rgba(0,0,0,.35)" : "inset 8px 0 18px rgba(0,0,0,.35)",
        }}
      >
        {/* arched carved panel */}
        <div
          className="absolute inset-x-[14%] top-[10%] bottom-[18%] overflow-hidden border-2 text-inv-accent"
          style={{ borderColor: "color-mix(in srgb, var(--inv-accent) 70%, transparent)", borderRadius: "999px 999px 6px 6px", background: `color-mix(in srgb, ${wood} 80%, black)` }}
        >
          <Pattern pattern={ornament === "floral" || ornament === "leaves" ? "floral" : ornament === "arabesque" ? "arabesque" : "stars"} opacity={0.4} />
          <div className="absolute inset-2 border" style={{ borderColor: "color-mix(in srgb, var(--inv-accent) 40%, transparent)", borderRadius: "999px 999px 4px 4px" }} />
        </div>
        {/* lower panel */}
        <div className="absolute inset-x-[14%] bottom-[5%] h-[9%] border" style={{ borderColor: "color-mix(in srgb, var(--inv-accent) 55%, transparent)", borderRadius: 6 }} />
        {/* ring handle near the center seam */}
        <div className={`absolute top-[82%] h-8 w-8 -translate-y-1/2 rounded-full border-[3px] ${isLeft ? "right-[6%]" : "left-[6%]"}`} style={{ borderColor: "var(--inv-accent)", boxShadow: "0 2px 6px rgba(0,0,0,.4)" }} />
        {/* gold edge along the seam */}
        <div className={`absolute inset-y-0 w-[3px] ${isLeft ? "right-0" : "left-0"}`} style={{ background: "var(--inv-accent)", opacity: 0.8 }} />
      </div>
    </motion.div>
  );
}

function GateScene({ monogram, title, guestName, ornament, velvet, d }: IntroProps) {
  const wood = velvet ?? "var(--inv-envelope)";
  return (
    <div className="absolute inset-0 [perspective:1800px]">
      <Door side="left" ornament={ornament} wood={wood} />
      <Door side="right" ornament={ornament} wood={wood} />
      {/* arch frame over the doors */}
      <motion.div className="pointer-events-none absolute inset-x-0 top-0 h-[12%]" exit={{ y: "-100%", transition: { duration: 0.8, delay: 0.3 } }}>
        <div className="h-full" style={{ background: `linear-gradient(180deg, color-mix(in srgb, ${wood} 60%, black), color-mix(in srgb, ${wood} 80%, black))`, borderBottom: "3px solid var(--inv-accent)" }} />
      </motion.div>
      <motion.div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center" exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.35 } }}>
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 55% 38% at 50% 48%, rgba(0,0,0,.45), transparent 75%)" }} />
        <p className="relative font-body text-lg text-white/85 drop-shadow">{d.weddingInvitation}</p>
        <div className="relative flex h-32 w-32 items-center justify-center rounded-full border-[5px] border-double shadow-2xl" style={{ borderColor: "var(--inv-accent)", background: `color-mix(in srgb, ${wood} 55%, black)` }}>
          <span className="font-heading text-4xl" style={{ color: "var(--inv-accent)" }}>
            {monogram}
          </span>
        </div>
        <p className="relative font-heading text-3xl drop-shadow" style={{ color: "var(--inv-accent)" }}>
          {title}
        </p>
        {guestName && (
          <p className="relative font-body text-lg text-white/90 drop-shadow">
            {d.toHonor} <span className="font-heading text-2xl">{guestName}</span>
          </p>
        )}
        <div className="relative mt-6">
          <TapHint label={d.tapToEnter} light />
        </div>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Theater curtain: velvet curtains draw apart
// ---------------------------------------------------------------------------

const velvetOf = (color: string) =>
  `repeating-linear-gradient(90deg, rgba(0,0,0,.38) 0px, rgba(255,255,255,.10) 22px, rgba(0,0,0,.38) 44px), linear-gradient(180deg, color-mix(in srgb, ${color} 85%, white), ${color} 30%, color-mix(in srgb, ${color} 70%, black))`;

function CurtainScene({ monogram, title, guestName, velvet, d }: IntroProps) {
  const VELVET = velvetOf(velvet ?? "var(--inv-seal)");
  return (
    <div className="absolute inset-0">
      {(["left", "right"] as const).map((side) => (
        <motion.div
          key={side}
          className={`absolute inset-y-0 w-[52%] ${side === "left" ? "left-0 origin-left" : "right-0 origin-right"}`}
          style={{ background: VELVET, boxShadow: side === "left" ? "inset -12px 0 24px rgba(0,0,0,.45)" : "inset 12px 0 24px rgba(0,0,0,.45)" }}
          initial={{ x: 0, scaleX: 1 }}
          exit={{ x: side === "left" ? "-92%" : "92%", scaleX: 0.55 }}
          transition={{ duration: 1.4, ease: [0.65, 0, 0.35, 1] }}
        >
          <div className="absolute inset-x-0 bottom-0 h-3" style={{ background: "linear-gradient(180deg, var(--inv-accent), color-mix(in srgb, var(--inv-accent) 60%, black))" }} />
          {/* tie-back rope */}
          <div className={`absolute top-[78%] h-2 w-[40%] rounded-full ${side === "left" ? "right-[8%]" : "left-[8%]"}`} style={{ background: "var(--inv-accent)", boxShadow: "0 2px 4px rgba(0,0,0,.4)" }} />
        </motion.div>
      ))}
      {/* valance with fringe */}
      <motion.div className="absolute inset-x-0 top-0 h-[13%]" exit={{ y: "-110%", transition: { duration: 0.9, delay: 0.5 } }}>
        <div className="h-full" style={{ background: VELVET, boxShadow: "0 8px 18px rgba(0,0,0,.45)" }} />
        <div
          className="h-4"
          style={{ background: "repeating-linear-gradient(90deg, var(--inv-accent) 0 3px, transparent 3px 7px)", maskImage: "linear-gradient(180deg, black, transparent)", WebkitMaskImage: "linear-gradient(180deg, black, transparent)" }}
        />
      </motion.div>
      <motion.div className="absolute inset-0 flex items-center justify-center px-6" exit={{ opacity: 0, y: -30, transition: { duration: 0.35 } }}>
        <div className="w-full max-w-xs rounded-2xl border px-6 py-8 text-center shadow-2xl" style={{ borderColor: "var(--inv-accent)", background: "var(--inv-surface)" }}>
          <p className="font-body text-inv-muted">{d.weddingInvitation}</p>
          <p className="mt-2 font-heading text-4xl text-inv-accent">{monogram}</p>
          <p className="mt-2 font-heading text-2xl text-inv-accent">{title}</p>
          {guestName && (
            <p className="mt-3 font-body text-inv-text">
              {d.toHonor} <span className="font-heading text-xl">{guestName}</span>
            </p>
          )}
          <div className="mt-5">
            <TapHint label={d.tapToRaise} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
