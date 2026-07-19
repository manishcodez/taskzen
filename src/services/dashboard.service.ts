import { TaskPriority, TaskStatus } from "@/generated/prisma/client";

import { db } from "@/lib/db";
import { getThisWeekRangeUtc, getTodayRangeUtc } from "@/lib/utils/date-ranges";
import { isTaskOverdue } from "@/lib/utils/time";
import { mapTask } from "@/services/task.service";

const taskWithSubjectInclude = {
  subject: {
    select: {
      id: true,
      name: true,
      color: true,
      code: true,
    },
  },
} as const;

const WIDGET_LIMIT = 10;

export async function getDashboardForUser(userId: string, tzOffset = 0) {
  const now = new Date();
  const { start: todayStart, end: todayEnd } = getTodayRangeUtc(tzOffset);
  const { start: weekStart, end: weekEnd } = getThisWeekRangeUtc(tzOffset);

  const overdueWhere = {
    userId,
    dueDate: { lt: now },
    status: { not: TaskStatus.COMPLETED },
  };

  const dueTodayWhere = {
    userId,
    dueDate: { gte: todayStart, lte: todayEnd },
  };

  const dueThisWeekWhere = {
    userId,
    dueDate: { gte: weekStart, lte: weekEnd },
  };

  const pendingWhere = {
    userId,
    status: { not: TaskStatus.COMPLETED },
  };

  const [
    total,
    completed,
    pending,
    overdue,
    dueToday,
    dueThisWeek,
    todaysTasksRaw,
    upcomingDeadlinesRaw,
    priorityTasksRaw,
    workloadTasksRaw,
  ] = await Promise.all([
    db.task.count({ where: { userId } }),
    db.task.count({ where: { userId, status: TaskStatus.COMPLETED } }),
    db.task.count({ where: pendingWhere }),
    db.task.count({ where: overdueWhere }),
    db.task.count({ where: dueTodayWhere }),
    db.task.count({ where: dueThisWeekWhere }),
    db.task.findMany({
      where: dueTodayWhere,
      include: taskWithSubjectInclude,
      orderBy: [{ dueDate: "asc" }, { priority: "desc" }],
      take: WIDGET_LIMIT,
    }),
    db.task.findMany({
      where: {
        userId,
        status: { not: TaskStatus.COMPLETED },
        dueDate: { gte: now },
      },
      include: taskWithSubjectInclude,
      orderBy: [{ dueDate: "asc" }],
      take: WIDGET_LIMIT,
    }),
    db.task.findMany({
      where: {
        userId,
        status: { not: TaskStatus.COMPLETED },
        priority: { in: [TaskPriority.HIGH, TaskPriority.URGENT] },
      },
      include: taskWithSubjectInclude,
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
      take: WIDGET_LIMIT,
    }),
    db.task.findMany({
      where: pendingWhere,
      select: {
        subjectId: true,
        dueDate: true,
        status: true,
        subject: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    }),
  ]);

  const completionPercentage =
    total === 0 ? 0 : Math.round((completed / total) * 100);

  const workloadMap = new Map<
    string,
    {
      subjectId: string;
      subjectName: string;
      color: string;
      pendingCount: number;
      overdueCount: number;
      dueThisWeekCount: number;
    }
  >();

  for (const task of workloadTasksRaw) {
    const existing = workloadMap.get(task.subjectId) ?? {
      subjectId: task.subject.id,
      subjectName: task.subject.name,
      color: task.subject.color,
      pendingCount: 0,
      overdueCount: 0,
      dueThisWeekCount: 0,
    };

    existing.pendingCount += 1;

    if (isTaskOverdue(task.dueDate, task.status, now)) {
      existing.overdueCount += 1;
    }

    if (
      task.dueDate &&
      task.dueDate.getTime() >= weekStart.getTime() &&
      task.dueDate.getTime() <= weekEnd.getTime()
    ) {
      existing.dueThisWeekCount += 1;
    }

    workloadMap.set(task.subjectId, existing);
  }

  const workloadOverview = Array.from(workloadMap.values()).sort(
    (a, b) => b.pendingCount - a.pendingCount,
  );

  return {
    counts: {
      total,
      completed,
      pending,
      overdue,
      dueToday,
      dueThisWeek,
      completionPercentage,
    },
    todaysTasks: todaysTasksRaw.map(mapTask),
    upcomingDeadlines: upcomingDeadlinesRaw.map(mapTask),
    priorityTasks: priorityTasksRaw.map(mapTask),
    workloadOverview,
  };
}
