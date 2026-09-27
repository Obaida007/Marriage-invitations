"use client";

import { AnimatePresence, motion } from "motion/react";
import type { Dict } from "@/lib/i18n";

/** Full-screen envelope intro. Opening it also unlocks audio playback (user gesture). */
export function Envelope({
  open,
  onOpen,
  initials,
  guestName,
  d,
}: {
  open: boolean;
  onOpen: () => void;
  initials: string;
  guestName?: string;
  d: Dict;
}) {
  return (
    <AnimatePresence>
      {!open && (
        <motion.div
          key="envelope"
          className="fixed inset-0 z-50 flex items-center justify-center bg-inv-bg p-6"
          exit={{ opacity: 0, transition: { duration: 0.7, delay: 0.9 } }}
        >
          <button
            type="button"
            onClick={onOpen}
            className="group relative flex flex-col items-center outline-none"
            aria-label={d.openInvitation}
          >
            {guestName && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-6 text-center font-body text-lg text-inv-muted"
              >
                {d.dear} <span className="font-heading text-2xl text-inv-accent">{guestName}</span>
              </motion.p>
            )}
            <div className="relative h-[210px] w-[300px] [perspective:1200px] sm:h-[240px] sm:w-[350px]">
              {/* Back */}
              <div className="absolute inset-0 rounded-md bg-inv-envelope shadow-2xl shadow-black/15" />
              {/* Letter peeking out */}
              <motion.div
                className="absolute inset-x-4 top-3 bottom-6 rounded-sm border border-inv-border bg-inv-surface"
                exit={{ y: -120 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              />
              {/* Front pocket */}
              <div
                className="absolute inset-0 rounded-md"
                style={{
                  background: "linear-gradient(160deg, var(--inv-envelope), color-mix(in srgb, var(--inv-envelope) 85%, black))",
                  clipPath: "polygon(0 0, 50% 55%, 100% 0, 100% 100%, 0 100%)",
                }}
              />
              {/* Flap */}
              <motion.div
                className="absolute inset-x-0 top-0 h-[60%] origin-top"
                style={{
                  background: "color-mix(in srgb, var(--inv-envelope) 92%, black)",
                  clipPath: "polygon(0 0, 100% 0, 50% 100%)",
                  transformStyle: "preserve-3d",
                }}
                exit={{ rotateX: 180 }}
                transition={{ duration: 0.6 }}
              />
              {/* Wax seal */}
              <motion.div
                className="absolute left-1/2 top-[52%] flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-inv-seal font-heading text-lg text-white shadow-lg ring-4 ring-inv-seal/30 transition group-hover:scale-105"
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <span className="drop-shadow">{initials}</span>
              </motion.div>
            </div>
            <span className="float-soft mt-8 font-sans text-sm tracking-wide text-inv-muted">{d.tapToOpen}</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
