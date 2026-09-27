"use client";

import { Icon } from "./Ornaments";

export function MusicButton({ playing, onToggle, label }: { playing: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      aria-pressed={playing}
      className="fixed bottom-5 end-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-inv-accent text-inv-surface shadow-lg shadow-black/20 transition hover:scale-105"
    >
      <span className={playing ? "spin-slow" : ""}>
        <Icon name={playing ? "music" : "play"} className="h-5 w-5" />
      </span>
    </button>
  );
}
