import type { Particle } from "@/lib/themes";

// Deterministic values keep server and client markup identical.
const PETALS = Array.from({ length: 14 }, (_, i) => ({
  left: (i * 37) % 100,
  size: 8 + ((i * 7) % 9),
  duration: 11 + ((i * 5) % 9),
  delay: -((i * 3.3) % 14),
  drift: (i % 2 ? 1 : -1) * (30 + ((i * 11) % 50)),
}));

const GLYPH: Partial<Record<Particle, string>> = { hearts: "♥", stars: "✦" };

export function Petals({ shape = "petals" }: { shape?: Particle }) {
  const glyph = GLYPH[shape];
  return (
    <div className="pointer-events-none fixed inset-0 z-10 overflow-hidden" aria-hidden>
      {PETALS.map((p, i) => (
        <span
          key={i}
          className="petal"
          data-shape={shape}
          style={
            {
              left: `${p.left}%`,
              width: glyph ? undefined : shape === "sparkles" ? p.size / 2.5 : p.size,
              height: glyph ? undefined : shape === "sparkles" ? p.size / 2.5 : p.size,
              fontSize: glyph ? p.size + 4 : undefined,
              lineHeight: 1,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              "--drift": `${p.drift}px`,
            } as React.CSSProperties
          }
        >
          {glyph}
        </span>
      ))}
    </div>
  );
}
