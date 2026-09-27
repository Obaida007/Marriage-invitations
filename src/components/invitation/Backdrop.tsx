"use client";

import { useEffect, useRef } from "react";

/**
 * Background image or muted looping video with a color overlay.
 * "hero" fills its positioned parent; "page" stays pinned behind the whole
 * invitation (sticky rather than fixed, so it also works inside the editor's
 * scrollable phone preview).
 */
export function Backdrop({
  image,
  video,
  overlayColor,
  overlay,
  blur,
  scope,
}: {
  image?: string;
  video?: string;
  overlayColor: string;
  overlay: number;
  blur: number;
  scope: "hero" | "page";
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Respect reduced-motion: keep the poster frame instead of playing.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) v.pause();
    else v.play().catch(() => {});
  }, [video]);

  const mediaStyle = blur ? { filter: `blur(${blur}px)`, transform: "scale(1.08)" } : undefined;
  const layer = (
    <>
      {video ? (
        <video
          ref={videoRef}
          key={video}
          className="absolute inset-0 h-full w-full object-cover"
          style={mediaStyle}
          src={video}
          poster={image || undefined}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden
        />
      ) : image ? (
        // eslint-disable-next-line @next/next/no-img-element -- user-provided URLs from any host
        <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" style={mediaStyle} />
      ) : null}
      <div className="absolute inset-0" style={{ background: overlayColor, opacity: overlay / 100 }} />
    </>
  );

  if (scope === "page") {
    return (
      <div
        className="pointer-events-none sticky top-0 z-0 overflow-hidden"
        style={{ height: "var(--inv-viewport, 100svh)", marginBottom: "calc(var(--inv-viewport, 100svh) * -1)" }}
        aria-hidden
      >
        {layer}
      </div>
    );
  }
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {layer}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-inv-bg" />
    </div>
  );
}
