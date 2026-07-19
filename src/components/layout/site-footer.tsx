import { cn } from "@/lib/utils";

type SiteFooterProps = {
  className?: string;
};

export function SiteFooter({ className }: SiteFooterProps) {
  return (
    <footer
      className={cn(
        "border-t border-border/60 py-5 text-center text-xs text-muted-foreground",
        className,
      )}
    >
      <p>Taskzen v1.0 · Built by Manish Kumar</p>
    </footer>
  );
}
