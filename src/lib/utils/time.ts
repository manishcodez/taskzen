/**
 * Formats estimated task duration stored as minutes into a human-readable string.
 * Examples: 30 -> "30m", 60 -> "1h", 150 -> "2h 30m"
 */
export function formatEstimatedTime(minutes: number | null | undefined): string | null {
  if (minutes == null || minutes < 0) {
    return null;
  }

  if (minutes === 0) {
    return "0m";
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}m`;
  }

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Determines whether a task is overdue based on PRD rules:
 * dueDate is in the past AND status is not COMPLETED.
 */
export function isTaskOverdue(
  dueDate: Date | string | null | undefined,
  status: string,
  now: Date = new Date(),
): boolean {
  if (!dueDate || status === "COMPLETED") {
    return false;
  }

  const due = dueDate instanceof Date ? dueDate : new Date(dueDate);
  return due.getTime() < now.getTime();
}
