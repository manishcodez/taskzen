/**
 * Computes UTC date range boundaries for "today" in the user's timezone.
 * @param tzOffsetMinutes Minutes added to UTC to get local time (e.g. 330 for UTC+5:30)
 */
export function getTodayRangeUtc(tzOffsetMinutes = 0): { start: Date; end: Date } {
  const offsetMs = tzOffsetMinutes * 60 * 1000;
  const now = new Date();
  const localNow = new Date(now.getTime() + offsetMs);

  const startLocal = Date.UTC(
    localNow.getUTCFullYear(),
    localNow.getUTCMonth(),
    localNow.getUTCDate(),
  );
  const endLocal = startLocal + 24 * 60 * 60 * 1000 - 1;

  return {
    start: new Date(startLocal - offsetMs),
    end: new Date(endLocal - offsetMs),
  };
}

/**
 * Computes UTC date range boundaries for the current week (Mon–Sun) in the user's timezone.
 */
export function getThisWeekRangeUtc(tzOffsetMinutes = 0): { start: Date; end: Date } {
  const offsetMs = tzOffsetMinutes * 60 * 1000;
  const now = new Date();
  const localNow = new Date(now.getTime() + offsetMs);

  const day = localNow.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const mondayLocal = new Date(
    Date.UTC(
      localNow.getUTCFullYear(),
      localNow.getUTCMonth(),
      localNow.getUTCDate() + diffToMonday,
    ),
  );
  const sundayEndLocal =
    mondayLocal.getTime() + 7 * 24 * 60 * 60 * 1000 - 1;

  return {
    start: new Date(mondayLocal.getTime() - offsetMs),
    end: new Date(sundayEndLocal - offsetMs),
  };
}

export function getMonthRangeUtc(
  year: number,
  month: number,
  tzOffsetMinutes = 0,
): { start: Date; end: Date } {
  const offsetMs = tzOffsetMinutes * 60 * 1000;
  const startLocal = Date.UTC(year, month - 1, 1);
  const nextMonthStartLocal = Date.UTC(year, month, 1);
  const endLocal = nextMonthStartLocal - 1;

  return {
    start: new Date(startLocal - offsetMs),
    end: new Date(endLocal - offsetMs),
  };
}

export function toLocalDateKey(date: Date, tzOffsetMinutes = 0): string {
  const local = new Date(date.getTime() + tzOffsetMinutes * 60 * 1000);
  const year = local.getUTCFullYear();
  const month = String(local.getUTCMonth() + 1).padStart(2, "0");
  const day = String(local.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getClientTimezoneOffset(): number {
  return -new Date().getTimezoneOffset();
}
