import { Mail } from "lucide-react";
import type { SVGProps } from "react";

import { cn } from "@/lib/utils";

type SiteFooterProps = {
  className?: string;
};

const ROLES = [
  "Software Developer",
  "AI Enthusiast",
  "Programmer",
  "Product Builder",
] as const;

function LinkedInIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-4 w-4", className)}
      aria-hidden="true"
      {...props}
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-13h4" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function GitHubIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-4 w-4", className)}
      aria-hidden="true"
      {...props}
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.01.28-2.08 0-3.09 0 0-1 0-3 1.5A10.3 10.3 0 0 0 12 3c-1 0-2 .2-3 .5-2-1.5-3-1.5-3-1.5a5.4 5.4 0 0 0-.1 3.1c-.7 1-1 2.2-1 3.5 0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

const SOCIAL_LINKS = [
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/manishcodez",
    Icon: LinkedInIcon,
    external: true,
  },
  {
    label: "GitHub",
    href: "https://github.com/manishcodez",
    Icon: GitHubIcon,
    external: true,
  },
  {
    label: "Email",
    href: "mailto:manishyadav4u32@gmail.com",
    Icon: Mail,
    external: false,
  },
] as const;

export function SiteFooter({ className }: SiteFooterProps) {
  return (
    <footer
      className={cn(
        "border-t border-border/60 py-6 text-muted-foreground",
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 md:flex-row md:items-end md:justify-between md:gap-8 md:px-6 lg:px-8">
        <p className="text-left text-xs leading-relaxed">
          © 2026 Taskzen. All rights reserved.
        </p>

        <div className="flex w-full min-w-0 flex-col gap-2 md:w-auto md:items-end md:text-right">
          <p className="text-sm font-medium text-foreground/90">Made by ManishCodez</p>

          <p className="max-w-full text-xs font-normal not-italic leading-relaxed md:text-right">
            {ROLES.join(" · ")}
          </p>

          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            {SOCIAL_LINKS.map(({ label, href, Icon, external }) => (
              <a
                key={label}
                href={href}
                title={label}
                aria-label={label}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                {...(external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
