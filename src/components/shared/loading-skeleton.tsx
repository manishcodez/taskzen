"use client";

import { motion } from "framer-motion";

import { Skeleton } from "@/components/ui/skeleton";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { staggerContainer } from "@/lib/motion";
import { cn } from "@/lib/utils";

type LoadingSkeletonProps = {
  variant?: "default" | "tasks" | "detail" | "form";
};

function ShimmerBlock({ className }: { className?: string }) {
  return (
    <Skeleton
      className={cn(
        "relative overflow-hidden rounded-2xl before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.8s_infinite] before:bg-gradient-to-r before:from-transparent before:via-foreground/5 before:to-transparent",
        className,
      )}
    />
  );
}

export function LoadingSkeleton({ variant = "default" }: LoadingSkeletonProps) {
  const prefersReducedMotion = useReducedMotion();

  if (variant === "tasks") {
    return (
      <motion.div
        className="space-y-4"
        variants={staggerContainer(0.06, 0.02)}
        initial={prefersReducedMotion ? false : "hidden"}
        animate="show"
      >
        <ShimmerBlock className="h-12 w-full" />
        {Array.from({ length: 5 }).map((_, index) => (
          <ShimmerBlock key={index} className="h-16 w-full" />
        ))}
      </motion.div>
    );
  }

  if (variant === "detail") {
    return (
      <motion.div
        className="space-y-6"
        variants={staggerContainer(0.06, 0.02)}
        initial={prefersReducedMotion ? false : "hidden"}
        animate="show"
      >
        <div className="space-y-2">
          <ShimmerBlock className="h-4 w-24" />
          <ShimmerBlock className="h-10 w-2/3 max-w-md" />
          <ShimmerBlock className="h-4 w-full max-w-lg" />
        </div>
        <ShimmerBlock className="h-20 w-full" />
        <div className="grid gap-5 lg:grid-cols-2">
          <ShimmerBlock className="h-80 w-full" />
          <ShimmerBlock className="h-80 w-full" />
        </div>
      </motion.div>
    );
  }

  if (variant === "form") {
    return (
      <motion.div
        className="mx-auto max-w-3xl space-y-6"
        variants={staggerContainer(0.06, 0.02)}
        initial={prefersReducedMotion ? false : "hidden"}
        animate="show"
      >
        <div className="space-y-2">
          <ShimmerBlock className="h-4 w-20" />
          <ShimmerBlock className="h-9 w-48" />
        </div>
        <ShimmerBlock className="h-[420px] w-full" />
      </motion.div>
    );
  }

  return (
    <motion.div
      className="space-y-4"
      variants={staggerContainer(0.06, 0.02)}
      initial={prefersReducedMotion ? false : "hidden"}
      animate="show"
    >
      <ShimmerBlock className="h-8 w-48" />
      <ShimmerBlock className="h-4 w-full max-w-xl" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ShimmerBlock className="h-32 w-full" />
        <ShimmerBlock className="h-32 w-full" />
        <ShimmerBlock className="h-32 w-full" />
      </div>
    </motion.div>
  );
}

export function AuthFormSkeleton() {
  return (
    <div className="w-full max-w-md space-y-4 rounded-2xl border border-border/70 bg-panel p-6">
      <ShimmerBlock className="h-8 w-40" />
      <ShimmerBlock className="h-4 w-full" />
      <ShimmerBlock className="h-10 w-full" />
      <ShimmerBlock className="h-10 w-full" />
      <ShimmerBlock className="h-10 w-full" />
    </div>
  );
}

export function DashboardSkeleton() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className="space-y-6"
      variants={staggerContainer(0.06, 0.02)}
      initial={prefersReducedMotion ? false : "hidden"}
      animate="show"
    >
      <div className="space-y-2">
        <ShimmerBlock className="h-4 w-24" />
        <ShimmerBlock className="h-9 w-56" />
        <ShimmerBlock className="h-4 w-full max-w-80" />
      </div>
      <div className="grid gap-4 md:grid-cols-6 lg:grid-cols-12">
        <ShimmerBlock className="h-52 md:col-span-6 lg:col-span-5 lg:row-span-2" />
        <div className="grid grid-cols-2 gap-4 md:col-span-6 lg:col-span-7">
          {Array.from({ length: 4 }).map((_, index) => (
            <ShimmerBlock key={index} className="h-28 w-full" />
          ))}
        </div>
        <ShimmerBlock className="h-28 md:col-span-3 lg:col-span-4" />
      </div>
      <ShimmerBlock className="h-48 w-full" />
      <div className="grid gap-4 lg:grid-cols-12">
        <ShimmerBlock className="h-72 lg:col-span-7" />
        <div className="space-y-4 lg:col-span-5">
          <ShimmerBlock className="h-52 w-full" />
          <ShimmerBlock className="h-52 w-full" />
        </div>
      </div>
    </motion.div>
  );
}

export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <ShimmerBlock className="h-9 w-48" />
        <ShimmerBlock className="h-4 w-full max-w-96" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <ShimmerBlock key={index} className="h-32 w-full" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <ShimmerBlock className="h-96 w-full" />
        <ShimmerBlock className="h-96 w-full" />
        <ShimmerBlock className="h-96 w-full xl:col-span-2" />
      </div>
    </div>
  );
}
