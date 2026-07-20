import { cn } from "@/lib/utils";

type TaskzenLogoProps = {
  className?: string;
  showWordmark?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
  variant?: "default" | "inverse" | "mark-only";
};

const sizeMap = {
  xs: { mark: 24, word: "text-sm", gap: "gap-2" },
  sm: { mark: 28, word: "text-base", gap: "gap-2" },
  md: { mark: 36, word: "text-lg", gap: "gap-2.5" },
  lg: { mark: 44, word: "text-xl", gap: "gap-3" },
} as const;

/**
 * Zenith Ribbon — Taskzen brand mark.
 *
 * Soft rounded badge + three ascending ribbon bands that climb into a
 * terracotta focus node. Evokes calm momentum and structured clarity
 * without a letterform, checkmark, clock, or folder motif.
 */
function LogoMark({
  size,
  variant,
}: {
  size: number;
  variant: TaskzenLogoProps["variant"];
}) {
  const isInverse = variant === "inverse";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect
        x="2"
        y="2"
        width="40"
        height="40"
        rx="12"
        className={isInverse ? "fill-white/12" : "fill-primary/10"}
      />

      {/* Lower ribbon */}
      <path
        d="M10 31.2C10 29.57 11.32 28.25 12.95 28.25H22.1C23.05 28.25 23.93 27.79 24.48 27L28.85 20.7C29.4 19.91 30.28 19.45 31.23 19.45H32.55C34.18 19.45 35.5 20.77 35.5 22.4C35.5 24.03 34.18 25.35 32.55 25.35H31.7C30.75 25.35 29.87 25.81 29.32 26.6L24.95 32.9C24.4 33.69 23.52 34.15 22.57 34.15H12.95C11.32 34.15 10 32.83 10 31.2Z"
        className={isInverse ? "fill-white" : "fill-primary"}
      />

      {/* Middle ribbon */}
      <path
        d="M12.5 23.85C12.5 22.36 13.71 21.15 15.2 21.15H23.35C24.22 21.15 25.03 20.73 25.55 20.01L28.95 15.25C29.47 14.53 30.28 14.1 31.15 14.1H32.1C33.59 14.1 34.8 15.31 34.8 16.8C34.8 18.29 33.59 19.5 32.1 19.5H31.4C30.53 19.5 29.72 19.92 29.2 20.64L25.8 25.4C25.28 26.12 24.47 26.55 23.6 26.55H15.2C13.71 26.55 12.5 25.34 12.5 23.85Z"
        className={isInverse ? "fill-white/78" : "fill-brand-secondary"}
      />

      {/* Upper ribbon */}
      <path
        d="M15.2 16.55C15.2 15.22 16.27 14.15 17.6 14.15H24.55C25.34 14.15 26.07 13.77 26.54 13.12L28.55 10.35C29.02 9.7 29.75 9.32 30.54 9.32H31.2C32.53 9.32 33.6 10.39 33.6 11.72C33.6 13.05 32.53 14.12 31.2 14.12H30.75C29.96 14.12 29.23 14.5 28.76 15.15L26.75 17.92C26.28 18.57 25.55 18.95 24.76 18.95H17.6C16.27 18.95 15.2 17.88 15.2 16.55Z"
        className={isInverse ? "fill-white/55" : "fill-primary/75"}
      />

      {/* Focus node — the zenith */}
      <circle cx="33.15" cy="11.1" r="3.45" className="fill-brand-accent" />
    </svg>
  );
}

export function TaskzenLogo({
  className,
  showWordmark = true,
  size = "md",
  variant = "default",
}: TaskzenLogoProps) {
  const config = sizeMap[size];
  const wordClass = variant === "inverse" ? "text-white" : "text-foreground";

  if (variant === "mark-only") {
    return (
      <div className={className}>
        <LogoMark size={config.mark} variant={variant} />
      </div>
    );
  }

  return (
    <div className={cn("inline-flex items-center", config.gap, className)}>
      <LogoMark size={config.mark} variant={variant} />
      {showWordmark ? (
        <div className="min-w-0 leading-none">
          <span
            className={cn(
              "font-display font-semibold tracking-tight",
              config.word,
              wordClass,
            )}
          >
            Taskzen
          </span>
        </div>
      ) : null}
    </div>
  );
}

export function TaskzenLogoMark({
  className,
  size = 32,
  variant = "default",
}: {
  className?: string;
  size?: number;
  variant?: "default" | "inverse";
}) {
  return (
    <div className={className}>
      <LogoMark size={size} variant={variant === "inverse" ? "inverse" : "mark-only"} />
    </div>
  );
}
