import { Badge } from "@/components/ui/badge";
import {
  priorityClassName,
  statusClassName,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
} from "@/lib/tasks/labels";

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <Badge variant="outline" className={priorityClassName(priority)}>
      {TASK_PRIORITY_LABELS[priority] ?? priority}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={statusClassName(status)}>
      {TASK_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

export function OverdueBadge() {
  return <Badge variant="destructive">Overdue</Badge>;
}
