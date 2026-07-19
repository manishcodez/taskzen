"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Loader2, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { motionTransition } from "@/lib/motion";
import { cn } from "@/lib/utils";

type TaskCompleteButtonProps = {
  disabled?: boolean;
  isLoading?: boolean;
  onClick?: () => void;
  showLabel?: boolean;
  label?: string;
  loadingLabel?: string;
  size?: "sm" | "default";
};

export function TaskCompleteButton({
  disabled,
  isLoading,
  onClick,
  showLabel = false,
  label = "Complete",
  loadingLabel = "Completing...",
  size = "sm",
}: TaskCompleteButtonProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      whileTap={prefersReducedMotion ? undefined : { scale: 0.92 }}
      transition={motionTransition.spring}
    >
      <Button
        size={size}
        variant="outline"
        disabled={disabled || isLoading}
        onClick={onClick}
        className={cn(
          "overflow-hidden border-success/25 hover:border-success/40 hover:bg-success/8",
          isLoading && "border-success/30 bg-success/10",
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isLoading ? (
            <motion.span
              key="loading"
              initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={motionTransition.fast}
              className="flex items-center gap-1.5"
            >
              <Loader2 className="h-4 w-4 animate-spin text-success" />
              {showLabel ? loadingLabel : null}
            </motion.span>
          ) : (
            <motion.span
              key="idle"
              initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.5, rotate: -20 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={motionTransition.spring}
              className="flex items-center gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4 text-success" />
              {showLabel ? label : null}
            </motion.span>
          )}
        </AnimatePresence>
      </Button>
    </motion.div>
  );
}

type TaskReopenButtonProps = {
  disabled?: boolean;
  isLoading?: boolean;
  onClick?: () => void;
  showLabel?: boolean;
  label?: string;
  loadingLabel?: string;
  size?: "sm" | "default";
};

export function TaskReopenButton({
  disabled,
  isLoading,
  onClick,
  showLabel = false,
  label = "Reopen",
  loadingLabel = "Reopening...",
  size = "sm",
}: TaskReopenButtonProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      whileTap={prefersReducedMotion ? undefined : { scale: 0.92 }}
      transition={motionTransition.spring}
    >
      <Button
        size={size}
        variant="outline"
        disabled={disabled || isLoading}
        onClick={onClick}
        className={cn(
          "overflow-hidden border-primary/25 hover:border-primary/40 hover:bg-primary/8",
          isLoading && "border-primary/30 bg-primary/10",
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isLoading ? (
            <motion.span
              key="loading"
              initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={motionTransition.fast}
              className="flex items-center gap-1.5"
            >
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              {showLabel ? loadingLabel : null}
            </motion.span>
          ) : (
            <motion.span
              key="idle"
              initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.5, rotate: 90 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={motionTransition.spring}
              className="flex items-center gap-1.5"
            >
              <RotateCcw className="h-4 w-4 text-primary" />
              {showLabel ? label : null}
            </motion.span>
          )}
        </AnimatePresence>
      </Button>
    </motion.div>
  );
}
