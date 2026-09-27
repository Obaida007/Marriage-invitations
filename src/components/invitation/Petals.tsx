// Deterministic values keep server and client markup identical.
const PETALS = Array.from({ length: 14 }, (_, i) => ({
  left: (i * 37) % 100,
  size: 8 + ((i * 7) % 9),
  duration: 11 + ((i * 5) % 9),
  delay: -((i * 3.3) % 14),
  drift: ((i % 2 ? 1 : -1) * (30 + ((i * 11) % 50))),
}));

export function Petals() {
  return (
    <div className="pointer-events-none fixed inset-0 z-10 overflow-hidden" aria-hidden>
      {PETALS.map((p, i) => (
        <span
          key={i}
          className="petal"
          style={
            {
              left: `${p.left}%`,
              width: p.size,
              height: p.size,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              "--drift": `${p.drift}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
