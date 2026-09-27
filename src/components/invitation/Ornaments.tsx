import type { Ornament } from "@/lib/themes";

/** Decorative section divider, drawn in the theme accent color. */
export function Divider({ ornament, className = "" }: { ornament: Ornament; className?: string }) {
  const common = { className: `mx-auto h-8 w-56 text-inv-accent ${className}`, viewBox: "0 0 240 32", fill: "none", "aria-hidden": true };
  switch (ornament) {
    case "floral":
      return (
        <svg {...common}>
          <path d="M10 16h78M152 16h78" stroke="currentColor" strokeWidth="1" />
          <g fill="currentColor">
            <circle cx="120" cy="16" r="3.5" />
            {[0, 60, 120, 180, 240, 300].map((a) => (
              <ellipse key={a} cx="120" cy="8.5" rx="3" ry="6" transform={`rotate(${a} 120 16)`} opacity=".55" />
            ))}
            <path d="M96 16c4-6 10-6 14 0-4 6-10 6-14 0zM130 16c4-6 10-6 14 0-4 6-10 6-14 0z" opacity=".7" />
          </g>
        </svg>
      );
    case "geometric":
      return (
        <svg {...common}>
          <path d="M10 16h82M148 16h82" stroke="currentColor" strokeWidth="1" />
          <g stroke="currentColor" strokeWidth="1.2">
            <rect x="110" y="6" width="20" height="20" transform="rotate(45 120 16)" />
            <rect x="110" y="6" width="20" height="20" />
            <circle cx="120" cy="16" r="3" fill="currentColor" />
          </g>
          <circle cx="98" cy="16" r="2" fill="currentColor" />
          <circle cx="142" cy="16" r="2" fill="currentColor" />
        </svg>
      );
    case "leaves":
      return (
        <svg {...common}>
          <path d="M20 16c40 0 60 0 100 0s60 0 100 0" stroke="currentColor" strokeWidth="1" />
          <g fill="currentColor" opacity=".75">
            {[70, 88, 106].map((x) => (
              <path key={x} d={`M${x} 16c3-8 10-10 14-9-2 6-8 10-14 9z`} />
            ))}
            {[134, 152, 170].map((x) => (
              <path key={x} d={`M${x} 16c-3-8-10-10-14-9 2 6 8 10 14 9z`} transform={`translate(${14} 0)`} />
            ))}
            <circle cx="120" cy="16" r="3" />
          </g>
        </svg>
      );
    case "line":
      return (
        <svg {...common}>
          <path d="M40 16h70M130 16h70" stroke="currentColor" strokeWidth="1" />
          <circle cx="120" cy="16" r="2.5" fill="currentColor" />
        </svg>
      );
    case "dunes":
      return (
        <svg {...common}>
          <path d="M10 20c20-8 40-8 60 0s40 8 50-4c10 12 30 12 50 4s40-8 60 0" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="120" cy="9" r="3.5" fill="currentColor" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path d="M10 16h72M158 16h72" stroke="currentColor" strokeWidth="1" />
          <g stroke="currentColor" strokeWidth="1.2" fill="none">
            <path d="M82 16c8-9 18-9 22 0-4 9-14 9-22 0zM158 16c-8-9-18-9-22 0 4 9 14 9 22 0z" />
            <path d="M120 4l6 12-6 12-6-12z" fill="currentColor" />
            <circle cx="108" cy="16" r="1.8" fill="currentColor" />
            <circle cx="132" cy="16" r="1.8" fill="currentColor" />
          </g>
        </svg>
      );
  }
}

/** Corner flourish; rotate for the other corners. */
export function Corner({ ornament, className = "" }: { ornament: Ornament; className?: string }) {
  if (ornament === "line") {
    return (
      <svg className={`h-16 w-16 text-inv-accent ${className}`} viewBox="0 0 64 64" fill="none" aria-hidden>
        <path d="M4 40V4h36" stroke="currentColor" strokeWidth="1" />
      </svg>
    );
  }
  if (ornament === "floral") {
    return (
      <svg className={`h-24 w-24 text-inv-accent ${className}`} viewBox="0 0 96 96" fill="currentColor" aria-hidden>
        <g opacity=".5">
          <path d="M4 4c30 4 46 18 52 44" stroke="currentColor" fill="none" strokeWidth="1" />
          <circle cx="22" cy="14" r="6" />
          <circle cx="14" cy="24" r="4" />
          <circle cx="36" cy="22" r="3" />
          <path d="M40 30c6-4 12-3 14 2-6 3-11 2-14-2zM48 44c6-2 11 0 12 5-6 2-10 0-12-5z" />
        </g>
      </svg>
    );
  }
  if (ornament === "leaves") {
    return (
      <svg className={`h-24 w-24 text-inv-accent ${className}`} viewBox="0 0 96 96" fill="currentColor" aria-hidden>
        <g opacity=".45">
          <path d="M4 4C30 10 50 30 60 60" stroke="currentColor" fill="none" strokeWidth="1.2" />
          {[14, 26, 38, 50].map((d) => (
            <path key={d} d={`M${d * 0.9 + 4} ${d * 0.8 + 4}c-8-2-12-8-12-14 8 1 12 7 12 14zM${d * 0.9 + 6} ${d * 0.8 + 2}c2-8 8-12 14-12-1 8-7 12-14 12z`} />
          ))}
        </g>
      </svg>
    );
  }
  return (
    <svg className={`h-20 w-20 text-inv-accent ${className}`} viewBox="0 0 80 80" fill="none" aria-hidden>
      <g stroke="currentColor" strokeWidth="1" opacity=".7">
        <path d="M4 60V4h56" />
        <path d="M10 48V10h38" />
        <path d="M10 10c14 0 22 8 22 22-14 0-22-8-22-22z" />
        <circle cx="32" cy="32" r="2.5" fill="currentColor" />
        {ornament === "geometric" && <rect x="44" y="44" width="10" height="10" transform="rotate(45 49 49)" />}
      </g>
    </svg>
  );
}

/** Subtle repeating background pattern for the page. */
export function Pattern({ ornament }: { ornament: Ornament }) {
  if (ornament === "line" || ornament === "dunes") return null;
  const id = `pat-${ornament}`;
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full text-inv-accent opacity-[.07]" aria-hidden>
      <defs>
        <pattern id={id} width="56" height="56" patternUnits="userSpaceOnUse">
          {ornament === "floral" || ornament === "leaves" ? (
            <g fill="currentColor">
              <circle cx="28" cy="28" r="2" />
              <ellipse cx="28" cy="20" rx="2.5" ry="5" />
              <ellipse cx="28" cy="36" rx="2.5" ry="5" />
              <ellipse cx="20" cy="28" rx="5" ry="2.5" />
              <ellipse cx="36" cy="28" rx="5" ry="2.5" />
            </g>
          ) : (
            <g stroke="currentColor" fill="none" strokeWidth="1">
              <rect x="16" y="16" width="24" height="24" />
              <rect x="16" y="16" width="24" height="24" transform="rotate(45 28 28)" />
              <circle cx="28" cy="28" r="5" />
            </g>
          )}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

export function Icon({ name, className = "h-5 w-5" }: { name: string; className?: string }) {
  const p = { className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  switch (name) {
    case "rings":
      return (
        <svg {...p}>
          <circle cx="9" cy="14" r="5.5" />
          <circle cx="15" cy="14" r="5.5" />
          <path d="M10 5l2-2 2 2-2 2z" />
        </svg>
      );
    case "hall":
      return (
        <svg {...p}>
          <path d="M3 21h18M5 21V10l7-6 7 6v11M9 21v-6h6v6" />
        </svg>
      );
    case "dinner":
      return (
        <svg {...p}>
          <path d="M4 3v7a2 2 0 002 2h0a2 2 0 002-2V3M6 12v9M17 21V3c-2 1-3 4-3 7h3" />
        </svg>
      );
    case "music":
      return (
        <svg {...p}>
          <path d="M9 18V5l11-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="17" cy="16" r="3" />
        </svg>
      );
    case "camera":
      return (
        <svg {...p}>
          <path d="M3 8h4l2-3h6l2 3h4v11H3z" />
          <circle cx="12" cy="13" r="3.5" />
        </svg>
      );
    case "cake":
      return (
        <svg {...p}>
          <path d="M4 21h16v-8H4zM4 16c2 1.5 4 1.5 6 0s4-1.5 6 0 3 1.5 4 0M8 13V9m4 4V9m4 4V9M8 6v0m4 0v0m4 0v0" />
        </svg>
      );
    case "car":
      return (
        <svg {...p}>
          <path d="M3 16v-4l2-5h14l2 5v4zM3 16v3h3v-3m12 0v3h3v-3" />
          <circle cx="7.5" cy="13" r="1" />
          <circle cx="16.5" cy="13" r="1" />
        </svg>
      );
    case "moon":
      return (
        <svg {...p}>
          <path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...p}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18M8 3v4M16 3v4" />
        </svg>
      );
    case "clock":
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case "pin":
      return (
        <svg {...p}>
          <path d="M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      );
    case "share":
      return (
        <svg {...p}>
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="M8.6 10.5l6.8-4M8.6 13.5l6.8 4" />
        </svg>
      );
    case "phone":
      return (
        <svg {...p}>
          <path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2" />
        </svg>
      );
    case "play":
      return (
        <svg {...p}>
          <path d="M7 4l13 8-13 8z" fill="currentColor" />
        </svg>
      );
    case "pause":
      return (
        <svg {...p}>
          <path d="M7 4h3v16H7zM14 4h3v16h-3z" fill="currentColor" />
        </svg>
      );
    case "check":
      return (
        <svg {...p}>
          <path d="M5 12l5 5 9-10" />
        </svg>
      );
    case "info":
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5M12 8v.01" />
        </svg>
      );
    default:
      return (
        <svg {...p}>
          <path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z" />
        </svg>
      );
  }
}
