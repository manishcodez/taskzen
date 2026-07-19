"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { motionTransition } from "@/lib/motion";

const SUBJECT_COLORS = [
  "#6366f1",
  "#3b82f6",
  "#06b6d4",
  "#22c55e",
  "#eab308",
  "#f97316",
  "#ef4444",
  "#ec4899",
  "#a855f7",
] as const;

type SubjectColorPickerProps = {
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
};

export function SubjectColorPicker({ value, onChange, disabled }: SubjectColorPickerProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="space-y-3 rounded-[1.25rem] border border-border/60 bg-gradient-to-br from-primary/5 via-card/80 to-accent/5 p-4 shadow-soft">
      <p className="label-caps text-primary">Pick a color</p>
      <div className="flex flex-wrap gap-2.5">
        {SUBJECT_COLORS.map((color) => (
          <motion.button
            key={color}
            type="button"
            disabled={disabled}
            aria-label={`Select color ${color}`}
            onClick={() => onChange(color)}
            whileHover={prefersReducedMotion || disabled ? undefined : { scale: 1.1 }}
            whileTap={prefersReducedMotion || disabled ? undefined : { scale: 0.95 }}
            transition={motionTransition.fast}
            className={cn(
              "h-9 w-9 rounded-full border-2 shadow-soft",
              value === color
                ? "border-accent ring-2 ring-accent/30 ring-offset-2 ring-offset-background scale-110"
                : "border-transparent opacity-90 hover:opacity-100",
            )}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span
          className="h-3.5 w-3.5 rounded-full shadow-soft ring-1 ring-border/60"
          style={{ backgroundColor: value }}
        />
        <span>
          Selected: <span className="font-medium text-foreground">{value}</span>
        </span>
      </div>
    </div>
  );
}

export { SUBJECT_COLORS };
