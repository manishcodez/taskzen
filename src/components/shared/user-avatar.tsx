import { cn } from "@/lib/utils";

type UserAvatarProps = {
  name?: string | null;
  email?: string | null;
  photoUrl?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "h-10 w-10 text-sm",
  md: "h-16 w-16 text-base",
  lg: "h-44 w-44 text-2xl",
} as const;

export function UserAvatar({
  name,
  email,
  photoUrl,
  className,
  size = "sm",
}: UserAvatarProps) {
  const initials = (name || email || "S")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={name ? `${name} profile photo` : "Profile photo"}
        className={cn(
          "shrink-0 rounded-full border border-border/60 object-cover shadow-soft",
          sizeClasses[size],
          className,
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground shadow-soft",
        sizeClasses[size],
        className,
      )}
      aria-hidden={Boolean(name || email)}
    >
      {initials}
    </div>
  );
}
