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
        rx="14"
        className={isInverse ? "fill-white/12" : "fill-primary/10"}
      />
      <path
        d="M12 28C16 24 20 22 24 22C28 22 31 23.5 34 26"
        stroke={isInverse ? "white" : "currentColor"}
        className={isInverse ? "" : "text-primary"}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M12 21C15.5 18.5 19 17 23 17C27.5 17 30.5 18.5 33 21"
        stroke={isInverse ? "white" : "currentColor"}
        className={isInverse ? "opacity-80" : "text-brand-secondary"}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M12 14C15 12 18.5 11 22 11C26.5 11 29.5 12.2 32 14.5"
        stroke={isInverse ? "white" : "currentColor"}
        className={isInverse ? "opacity-60" : "text-brand-accent"}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle
        cx="34"
        cy="14"
        r="3"
        className={isInverse ? "fill-brand-accent" : "fill-brand-accent"}
      />
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
  const wordClass =
    variant === "inverse" ? "text-white" : "text-foreground";

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
          <span className={cn("font-display font-semibold tracking-tight", config.word, wordClass)}>
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
