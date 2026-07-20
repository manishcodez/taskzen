import { TaskStatus } from "@/generated/prisma/client";
import { getAdminUserEmail } from "@/lib/auth/admin-config";
import {
  genuineUserWhere,
  ownedByGenuineUserWhere,
} from "@/lib/analytics/genuine-usage";
import { db } from "@/lib/db";

const ACTIVE_USER_WINDOW_DAYS = 30;
const TREND_WINDOW_DAYS = 30;

export type AdminTrendPoint = {
  date: string;
  count: number;
};

export type AdminOverviewStats = {
  totalUsers: number;
  activeUsers: number;
  newUsersLast7Days: number;
  totalSubjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  completionRate: number;
};

export type AdminUserAnalytics = {
  totalUsers: number;
  activeUsers: number;
  newUsersLast7Days: number;
  newUsersLast30Days: number;
  registrationTrend: AdminTrendPoint[];
  dailyRegistrations: AdminTrendPoint[];
  weeklyRegistrations: AdminTrendPoint[];
  monthlyRegistrations: AdminTrendPoint[];
};

export type AdminProductAnalytics = {
  tasksCreatedTrend: AdminTrendPoint[];
  tasksCompletedTrend: AdminTrendPoint[];
  subjectsCreatedTrend: AdminTrendPoint[];
  taskStatusBreakdown: {
    completed: number;
    pending: number;
  };
  featureEngagement: {
    usersWithSubjects: number;
    usersWithTasks: number;
    usersWithCompletedTasks: number;
    usersWithScheduledTasks: number;
  };
};

export type AdminSystemHealth = {
  database: {
    status: "healthy" | "unhealthy";
    latencyMs: number | null;
  };
  api: {
    status: "healthy";
  };
  application: {
    version: string;
    environment: string;
  };
  checkedAt: string;
};

export type AdminActivityStats = {
  registrationTrend: AdminTrendPoint[];
  taskCreationTrend: AdminTrendPoint[];
  taskCompletionTrend: AdminTrendPoint[];
  subjectCreationTrend: AdminTrendPoint[];
  totals: {
    registrations: number;
    taskCreations: number;
    taskCompletions: number;
    subjectCreations: number;
  };
  loginTracking: {
    available: false;
    message: string;
  };
};

export type AdminSettingsInfo = {
  adminAccess: {
    configured: boolean;
    currentUserIsAdmin: true;
    accountStatus: "active" | "misconfigured";
  };
  security: {
    serverSideAuthorization: true;
    jwtCookieAuth: true;
    adminEnvConfigured: boolean;
  };
  application: {
    version: string;
    environment: string;
    name: string;
  };
  analytics: {
    excludesSyntheticTestAccounts: true;
    syntheticEmailDomain: "example.com";
  };
};

function startOfUtcDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getTrendStartDate(days: number): Date {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  return start;
}

function buildDailyTrend(dates: Date[], days = TREND_WINDOW_DAYS): AdminTrendPoint[] {
  const start = getTrendStartDate(days);
  const buckets = new Map<string, number>();

  for (let index = 0; index < days; index += 1) {
    const day = new Date(start);
    day.setUTCDate(start.getUTCDate() + index);
    buckets.set(startOfUtcDay(day), 0);
  }

  for (const date of dates) {
    const key = startOfUtcDay(date);
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
  }

  return Array.from(buckets.entries()).map(([date, count]) => ({ date, count }));
}

function buildWeeklyTrend(dates: Date[]): AdminTrendPoint[] {
  const buckets = new Map<string, number>();

  for (const date of dates) {
    const day = date.getUTCDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(date);
    monday.setUTCDate(date.getUTCDate() + diffToMonday);
    monday.setUTCHours(0, 0, 0, 0);
    const key = startOfUtcDay(monday);
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  return Array.from(buckets.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-12)
    .map(([date, count]) => ({ date, count }));
}

function buildMonthlyTrend(dates: Date[]): AdminTrendPoint[] {
  const buckets = new Map<string, number>();

  for (const date of dates) {
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  return Array.from(buckets.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-12)
    .map(([date, count]) => ({ date, count }));
}

function daysAgo(days: number): Date {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date;
}

function getAppVersion(): string {
  return process.env.npm_package_version ?? "0.1.0";
}

function getSafeEnvironment(): string {
  return process.env.NODE_ENV === "production" ? "production" : "development";
}

async function getActiveUserCount(): Promise<number> {
  const activeSince = daysAgo(ACTIVE_USER_WINDOW_DAYS);

  const [profileActiveUsers, taskActiveUsers] = await Promise.all([
    db.user.findMany({
      where: {
        ...genuineUserWhere,
        updatedAt: { gte: activeSince },
      },
      select: { id: true },
    }),
    db.task.findMany({
      where: {
        ...ownedByGenuineUserWhere,
        updatedAt: { gte: activeSince },
      },
      select: { userId: true },
      distinct: ["userId"],
    }),
  ]);

  const activeIds = new Set<string>();
  profileActiveUsers.forEach((user) => activeIds.add(user.id));
  taskActiveUsers.forEach((task) => activeIds.add(task.userId));

  return activeIds.size;
}

export async function getAdminOverviewStats(): Promise<AdminOverviewStats> {
  const sevenDaysAgo = daysAgo(7);

  const [
    totalUsers,
    activeUsers,
    newUsersLast7Days,
    totalSubjects,
    totalTasks,
    completedTasks,
  ] = await Promise.all([
    db.user.count({ where: genuineUserWhere }),
    getActiveUserCount(),
    db.user.count({
      where: {
        ...genuineUserWhere,
        createdAt: { gte: sevenDaysAgo },
      },
    }),
    db.subject.count({ where: ownedByGenuineUserWhere }),
    db.task.count({ where: ownedByGenuineUserWhere }),
    db.task.count({
      where: {
        ...ownedByGenuineUserWhere,
        status: TaskStatus.COMPLETED,
      },
    }),
  ]);

  const pendingTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    totalUsers,
    activeUsers,
    newUsersLast7Days,
    totalSubjects,
    totalTasks,
    completedTasks,
    pendingTasks,
    completionRate,
  };
}

export async function getAdminUserAnalytics(): Promise<AdminUserAnalytics> {
  const sevenDaysAgo = daysAgo(7);
  const thirtyDaysAgo = daysAgo(30);

  const [totalUsers, activeUsers, newUsersLast7Days, newUsersLast30Days, userDates] =
    await Promise.all([
      db.user.count({ where: genuineUserWhere }),
      getActiveUserCount(),
      db.user.count({
        where: {
          ...genuineUserWhere,
          createdAt: { gte: sevenDaysAgo },
        },
      }),
      db.user.count({
        where: {
          ...genuineUserWhere,
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      db.user.findMany({
        select: { createdAt: true },
        where: {
          ...genuineUserWhere,
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
    ]);

  const registrationDates = userDates.map((user) => user.createdAt);

  return {
    totalUsers,
    activeUsers,
    newUsersLast7Days,
    newUsersLast30Days,
    registrationTrend: buildDailyTrend(registrationDates),
    dailyRegistrations: buildDailyTrend(registrationDates),
    weeklyRegistrations: buildWeeklyTrend(registrationDates),
    monthlyRegistrations: buildMonthlyTrend(registrationDates),
  };
}

export async function getAdminProductAnalytics(): Promise<AdminProductAnalytics> {
  const thirtyDaysAgo = daysAgo(30);

  const [createdTasks, completedTasks, createdSubjects, statusGroups, taskUsers, subjectUsers] =
    await Promise.all([
      db.task.findMany({
        where: {
          ...ownedByGenuineUserWhere,
          createdAt: { gte: thirtyDaysAgo },
        },
        select: { createdAt: true },
      }),
      db.task.findMany({
        where: {
          ...ownedByGenuineUserWhere,
          completedAt: { gte: thirtyDaysAgo },
          status: TaskStatus.COMPLETED,
        },
        select: { completedAt: true },
      }),
      db.subject.findMany({
        where: {
          ...ownedByGenuineUserWhere,
          createdAt: { gte: thirtyDaysAgo },
        },
        select: { createdAt: true },
      }),
      db.task.groupBy({
        by: ["status"],
        where: ownedByGenuineUserWhere,
        _count: { _all: true },
      }),
      db.task.findMany({
        where: ownedByGenuineUserWhere,
        select: { userId: true },
        distinct: ["userId"],
      }),
      db.subject.findMany({
        where: ownedByGenuineUserWhere,
        select: { userId: true },
        distinct: ["userId"],
      }),
    ]);

  const completedCount =
    statusGroups.find((group) => group.status === TaskStatus.COMPLETED)?._count._all ?? 0;
  const pendingCount = statusGroups
    .filter((group) => group.status !== TaskStatus.COMPLETED)
    .reduce((sum, group) => sum + group._count._all, 0);

  const [completedTaskUsers, scheduledTaskUsers] = await Promise.all([
    db.task.findMany({
      where: {
        ...ownedByGenuineUserWhere,
        status: TaskStatus.COMPLETED,
      },
      select: { userId: true },
      distinct: ["userId"],
    }),
    db.task.findMany({
      where: {
        ...ownedByGenuineUserWhere,
        dueDate: { not: null },
      },
      select: { userId: true },
      distinct: ["userId"],
    }),
  ]);

  return {
    tasksCreatedTrend: buildDailyTrend(createdTasks.map((task) => task.createdAt)),
    tasksCompletedTrend: buildDailyTrend(
      completedTasks
        .map((task) => task.completedAt)
        .filter((date): date is Date => date instanceof Date),
    ),
    subjectsCreatedTrend: buildDailyTrend(createdSubjects.map((subject) => subject.createdAt)),
    taskStatusBreakdown: {
      completed: completedCount,
      pending: pendingCount,
    },
    featureEngagement: {
      usersWithSubjects: subjectUsers.length,
      usersWithTasks: taskUsers.length,
      usersWithCompletedTasks: completedTaskUsers.length,
      usersWithScheduledTasks: scheduledTaskUsers.length,
    },
  };
}

export async function getAdminSystemHealth(): Promise<AdminSystemHealth> {
  const startedAt = Date.now();
  let databaseStatus: AdminSystemHealth["database"]["status"] = "healthy";
  let latencyMs: number | null = null;

  try {
    await db.$queryRaw`SELECT 1`;
    latencyMs = Date.now() - startedAt;
  } catch {
    databaseStatus = "unhealthy";
  }

  return {
    database: {
      status: databaseStatus,
      latencyMs,
    },
    api: {
      status: "healthy",
    },
    application: {
      version: getAppVersion(),
      environment: getSafeEnvironment(),
    },
    checkedAt: new Date().toISOString(),
  };
}

export async function getAdminActivityStats(): Promise<AdminActivityStats> {
  const thirtyDaysAgo = daysAgo(30);

  const [registrations, taskCreations, taskCompletions, subjectCreations] = await Promise.all([
    db.user.findMany({
      where: {
        ...genuineUserWhere,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { createdAt: true },
    }),
    db.task.findMany({
      where: {
        ...ownedByGenuineUserWhere,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { createdAt: true },
    }),
    db.task.findMany({
      where: {
        ...ownedByGenuineUserWhere,
        completedAt: { gte: thirtyDaysAgo },
        status: TaskStatus.COMPLETED,
      },
      select: { completedAt: true },
    }),
    db.subject.findMany({
      where: {
        ...ownedByGenuineUserWhere,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { createdAt: true },
    }),
  ]);

  return {
    registrationTrend: buildDailyTrend(registrations.map((item) => item.createdAt)),
    taskCreationTrend: buildDailyTrend(taskCreations.map((item) => item.createdAt)),
    taskCompletionTrend: buildDailyTrend(
      taskCompletions
        .map((item) => item.completedAt)
        .filter((date): date is Date => date instanceof Date),
    ),
    subjectCreationTrend: buildDailyTrend(subjectCreations.map((item) => item.createdAt)),
    totals: {
      registrations: registrations.length,
      taskCreations: taskCreations.length,
      taskCompletions: taskCompletions.length,
      subjectCreations: subjectCreations.length,
    },
    loginTracking: {
      available: false,
      message: "Login events are not persisted. Only aggregate product activity is tracked.",
    },
  };
}

export async function getAdminSettingsInfo(): Promise<AdminSettingsInfo> {
  const adminConfigured = Boolean(getAdminUserEmail());

  return {
    adminAccess: {
      configured: adminConfigured,
      currentUserIsAdmin: true,
      accountStatus: adminConfigured ? "active" : "misconfigured",
    },
    security: {
      serverSideAuthorization: true,
      jwtCookieAuth: true,
      adminEnvConfigured: adminConfigured,
    },
    application: {
      version: getAppVersion(),
      environment: getSafeEnvironment(),
      name: "Taskzen",
    },
    analytics: {
      excludesSyntheticTestAccounts: true,
      syntheticEmailDomain: "example.com",
    },
  };
}
