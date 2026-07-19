import { TaskStatus } from "@/generated/prisma/client";

import { db } from "@/lib/db";
import {
  getMonthRangeUtc,
  getThisWeekRangeUtc,
  getTodayRangeUtc,
  toLocalDateKey,
} from "@/lib/utils/date-ranges";
import { isTaskOverdue } from "@/lib/utils/time";

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

const TREND_WEEKS = 8;

type TaskAnalyticsRecord = {
  status: TaskStatus;
  completedAt: Date | null;
  dueDate: Date | null;
  subjectId: string;
  subject: {
    id: string;
    name: string;
    color: string;
  };
};

function getWeekStartLocalDate(tzOffsetMinutes: number, weeksAgo: number): Date {
  const { start } = getThisWeekRangeUtc(tzOffsetMinutes);
  return new Date(start.getTime() - weeksAgo * 7 * 24 * 60 * 60 * 1000);
}

function formatWeekLabel(weekStart: Date, tzOffsetMinutes: number): string {
  const local = new Date(weekStart.getTime() + tzOffsetMinutes * 60 * 1000);
  return local.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function calculateProductivityStreak(
  completionDates: Set<string>,
  tzOffsetMinutes: number,
): number {
  if (completionDates.size === 0) {
    return 0;
  }

  const { start: todayStart } = getTodayRangeUtc(tzOffsetMinutes);
  let cursor = todayStart;
  let streak = 0;

  for (let index = 0; index < 365; index += 1) {
    const dateKey = toLocalDateKey(cursor, tzOffsetMinutes);

    if (completionDates.has(dateKey)) {
      streak += 1;
      cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000);
      continue;
    }

    if (index === 0) {
      cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000);
      continue;
    }

    break;
  }

  return streak;
}

function calculateMostProductiveDay(
  tasks: TaskAnalyticsRecord[],
  tzOffsetMinutes: number,
): string | null {
  const counts = new Array(7).fill(0) as number[];

  for (const task of tasks) {
    if (!task.completedAt) {
      continue;
    }

    const local = new Date(task.completedAt.getTime() + tzOffsetMinutes * 60 * 1000);
    counts[local.getUTCDay()] += 1;
  }

  const maxCount = Math.max(...counts);
  if (maxCount === 0) {
    return null;
  }

  const dayIndex = counts.findIndex((count) => count === maxCount);
  return WEEKDAY_NAMES[dayIndex] ?? null;
}

export async function getAnalyticsForUser(userId: string, tzOffset = 0) {
  const now = new Date();
  const { start: weekStart, end: weekEnd } = getThisWeekRangeUtc(tzOffset);
  const localNow = new Date(now.getTime() + tzOffset * 60 * 1000);
  const { start: monthStart, end: monthEnd } = getMonthRangeUtc(
    localNow.getUTCFullYear(),
    localNow.getUTCMonth() + 1,
    tzOffset,
  );

  const tasks = await db.task.findMany({
    where: { userId },
    select: {
      status: true,
      completedAt: true,
      dueDate: true,
      subjectId: true,
      subject: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
    },
  });

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(
    (task) => task.status === TaskStatus.COMPLETED && task.completedAt,
  );
  const pendingTasks = totalTasks - completedTasks.length;
  const totalCompleted = completedTasks.length;
  const completionRate =
    totalTasks === 0 ? 0 : Math.round((totalCompleted / totalTasks) * 100);

  const completedThisWeek = completedTasks.filter(
    (task) =>
      task.completedAt &&
      task.completedAt.getTime() >= weekStart.getTime() &&
      task.completedAt.getTime() <= weekEnd.getTime(),
  ).length;

  const completedThisMonth = completedTasks.filter(
    (task) =>
      task.completedAt &&
      task.completedAt.getTime() >= monthStart.getTime() &&
      task.completedAt.getTime() <= monthEnd.getTime(),
  ).length;

  const overdueCount = tasks.filter((task) =>
    isTaskOverdue(task.dueDate, task.status, now),
  ).length;

  const completionDates = new Set<string>();
  for (const task of completedTasks) {
    if (task.completedAt) {
      completionDates.add(toLocalDateKey(task.completedAt, tzOffset));
    }
  }

  const productivityStreak = calculateProductivityStreak(completionDates, tzOffset);
  const mostProductiveDay = calculateMostProductiveDay(tasks, tzOffset);

  const weeklyCompletionTrend = Array.from({ length: TREND_WEEKS }, (_, index) => {
    const weeksAgo = TREND_WEEKS - 1 - index;
    const currentWeekStart = getWeekStartLocalDate(tzOffset, weeksAgo);
    const currentWeekEnd = new Date(
      currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1,
    );

    const completed = completedTasks.filter(
      (task) =>
        task.completedAt &&
        task.completedAt.getTime() >= currentWeekStart.getTime() &&
        task.completedAt.getTime() <= currentWeekEnd.getTime(),
    ).length;

    return {
      weekLabel: formatWeekLabel(currentWeekStart, tzOffset),
      weekStart: toLocalDateKey(currentWeekStart, tzOffset),
      completed,
    };
  });

  const subjectMap = new Map<
    string,
    {
      subjectId: string;
      subjectName: string;
      color: string;
      total: number;
      completed: number;
      pending: number;
    }
  >();

  for (const task of tasks) {
    const existing = subjectMap.get(task.subjectId) ?? {
      subjectId: task.subject.id,
      subjectName: task.subject.name,
      color: task.subject.color,
      total: 0,
      completed: 0,
      pending: 0,
    };

    existing.total += 1;

    if (task.status === TaskStatus.COMPLETED) {
      existing.completed += 1;
    } else {
      existing.pending += 1;
    }

    subjectMap.set(task.subjectId, existing);
  }

  const subjectWorkload = Array.from(subjectMap.values()).sort(
    (a, b) => b.total - a.total,
  );

  return {
    summary: {
      completionRate,
      totalCompleted,
      completedThisWeek,
      completedThisMonth,
      productivityStreak,
      mostProductiveDay,
      overdueCount,
      totalTasks,
      pendingTasks,
    },
    weeklyCompletionTrend,
    subjectWorkload,
    taskStatusBreakdown: {
      completed: totalCompleted,
      pending: pendingTasks,
    },
  };
}
