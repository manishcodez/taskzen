"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { motionTransition } from "@/lib/motion";
import type { SubjectSummary } from "@/types";

type SubjectCardProps = {
  subject: SubjectSummary;
};

export function SubjectCard({ subject }: SubjectCardProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <Link href={`/subjects/${subject.id}`} className="group block h-full">
      <motion.div
        whileHover={prefersReducedMotion ? undefined : { y: -4 }}
        transition={motionTransition.base}
        className={cn(
          "bg-panel surface-interactive h-full overflow-hidden",
          "hover:border-primary/25",
        )}
      >
        <div
          className="h-1.5 w-full"
          style={{
            background: `linear-gradient(90deg, ${subject.color}, ${subject.color}88, oklch(0.42 0.07 205 / 0.3))`,
          }}
        />
        <div className="space-y-3 p-5">
          <div className="flex w-full min-w-0 items-start justify-between gap-2 max-sm:flex-wrap max-sm:gap-y-2 sm:gap-3">
            <div className="flex min-w-0 flex-1 items-start gap-3 overflow-hidden">
              <span
                className="mt-0.5 h-4 w-4 shrink-0 rounded-full shadow-soft ring-2 ring-background"
                style={{ backgroundColor: subject.color }}
              />
              <div className="min-w-0 flex-1">
                <h3 className="font-display truncate text-lg font-semibold tracking-tight transition-colors group-hover:text-primary">
                  {subject.name}
                </h3>
                {subject.code ? (
                  <p className="label-caps mt-1 truncate normal-case tracking-[0.1em]">
                    {subject.code}
                  </p>
                ) : null}
              </div>
            </div>
            <Badge
              variant="secondary"
              className="shrink-0 self-start bg-primary/10 text-primary shadow-soft"
            >
              {subject.taskCount} tasks
            </Badge>
          </div>
          {subject.description ? (
            <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {subject.description}
            </p>
          ) : (
            <p className="text-sm italic text-muted-foreground/70">No description yet</p>
          )}
        </div>
      </motion.div>
    </Link>
  );
}
