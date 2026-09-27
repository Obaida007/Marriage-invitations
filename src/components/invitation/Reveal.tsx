"use client";

import { createContext, useContext } from "react";
import { motion, useReducedMotion } from "motion/react";

export type RevealAnimation = "fade" | "slide" | "zoom" | "none";
export const RevealContext = createContext<RevealAnimation>("fade");

const INITIAL: Record<Exclude<RevealAnimation, "none">, Record<string, number>> = {
  fade: { opacity: 0, y: 28 },
  slide: { opacity: 0, x: 60 },
  zoom: { opacity: 0, scale: 0.9 },
};

export function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  const animation = useContext(RevealContext);
  if (animation === "none" || reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={INITIAL[animation]}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
