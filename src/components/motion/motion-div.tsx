"use client";

import { motion, type HTMLMotionProps } from "framer-motion";

import { useReducedMotion } from "@/hooks/use-reduced-motion";

type MotionDivProps = HTMLMotionProps<"div">;

export function MotionDiv({ transition, ...props }: MotionDivProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      transition={prefersReducedMotion ? { duration: 0 } : transition}
      {...props}
    />
  );
}
