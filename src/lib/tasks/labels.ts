import { cn } from "@/lib/utils";

export const TASK_TYPE_LABELS: Record<string, string> = {
  ASSIGNMENT: "Assignment",
  HOMEWORK: "Homework",
  PROJECT: "Project",
  EXAM_PREPARATION: "Exam Preparation",
  PRACTICAL: "Practical",
  PRESENTATION: "Presentation",
  READING: "Reading",
  PERSONAL_STUDY: "Personal Study",
  OTHER: "Other",
};

export const TASK_PRIORITY_LABELS: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export const TASK_STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
};

export const TASK_TYPE_OPTIONS = Object.entries(TASK_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export const TASK_PRIORITY_OPTIONS = Object.entries(TASK_PRIORITY_LABELS).map(
  ([value, label]) => ({
    value,
    label,
  }),
);

export const TASK_STATUS_OPTIONS = Object.entries(TASK_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export function formatTaskLabel(value: string): string {
  return value.replaceAll("_", " ");
}

const badgeBase =
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase";

export function priorityClassName(priority: string): string {
  switch (priority) {
    case "URGENT":
      return cn(badgeBase, "border-destructive/25 bg-destructive/10 text-destructive");
    case "HIGH":
      return cn(badgeBase, "border-warning/30 bg-warning/15 text-warning-foreground");
    case "MEDIUM":
      return cn(badgeBase, "border-brand-accent/30 bg-brand-accent/12 text-brand-accent");
    default:
      return cn(badgeBase, "border-border/80 bg-muted/80 text-muted-foreground");
  }
}

export function statusClassName(status: string): string {
  switch (status) {
    case "COMPLETED":
      return cn(badgeBase, "border-success/25 bg-success/10 text-success");
    case "IN_PROGRESS":
      return cn(badgeBase, "border-primary/25 bg-primary/8 text-primary");
    default:
      return cn(badgeBase, "border-border/80 bg-muted/80 text-muted-foreground");
  }
}

export function selectClassName(className?: string): string {
  return cn(
    "flex h-10 w-full rounded-xl border border-input/80 bg-card px-3 py-2 text-sm shadow-soft outline-none transition-all duration-200 focus-visible:border-primary/40 focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50",
    className,
  );
}
