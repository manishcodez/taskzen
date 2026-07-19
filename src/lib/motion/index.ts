"use client";

import type { Transition, Variants } from "framer-motion";

export const motionTransition = {
  fast: { duration: 0.18, ease: [0.22, 1, 0.36, 1] } satisfies Transition,
  base: { duration: 0.32, ease: [0.22, 1, 0.36, 1] } satisfies Transition,
  slow: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } satisfies Transition,
  spring: { type: "spring", stiffness: 420, damping: 32 } satisfies Transition,
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: motionTransition.base },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: motionTransition.base },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: motionTransition.base },
};

export const staggerContainer = (stagger = 0.07, delay = 0.04): Variants => ({
  hidden: {},
  show: {
    transition: {
      staggerChildren: stagger,
      delayChildren: delay,
    },
  },
});

export const slideX: Variants = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: motionTransition.base },
};

export function reducedMotionProps(prefersReducedMotion: boolean) {
  return prefersReducedMotion
    ? { initial: false, animate: false, transition: { duration: 0 } }
    : {};
}
