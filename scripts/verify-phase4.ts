import "dotenv/config";

import { hashPassword } from "../src/lib/auth/password";
import { db } from "../src/lib/db";
import { getClientTimezoneOffset, toLocalDateKey } from "../src/lib/utils/date-ranges";
import { createSubjectForUser } from "../src/services/subject.service";
import {
  completeTaskForUser,
  createTaskForUser,
  deleteTaskForUser,
  reopenTaskForUser,
} from "../src/services/task.service";
import { getCalendarForUser } from "../src/services/calendar.service";
import { getDashboardForUser } from "../src/services/dashboard.service";

async function createTestUser(email: string) {
  return db.user.create({
    data: {
      email,
      passwordHash: await hashPassword("password123"),
      name: email.split("@")[0],
    },
  });
}

async function main() {
  const suffix = Date.now();
  const userA = await createTestUser(`phase4-a-${suffix}@example.com`);
  const userB = await createTestUser(`phase4-b-${suffix}@example.com`);
  const tzOffset = getClientTimezoneOffset();

  const subjectA = await createSubjectForUser(userA.id, {
    name: "Software Engineering",
    color: "#6366f1",
  });
  const subjectB = await createSubjectForUser(userB.id, {
    name: "Chemistry",
    color: "#22c55e",
  });

  const now = new Date();
  const overdueDueDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
  const todayDueDate = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();
  const futureDueDate = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString();

  const overdueTask = await createTaskForUser(userA.id, {
    title: "Overdue assignment",
    subjectId: subjectA.id,
    type: "ASSIGNMENT",
    priority: "URGENT",
    status: "NOT_STARTED",
    dueDate: overdueDueDate,
  });

  const todayTask = await createTaskForUser(userA.id, {
    title: "Due today task",
    subjectId: subjectA.id,
    type: "HOMEWORK",
    priority: "HIGH",
    status: "IN_PROGRESS",
    dueDate: todayDueDate,
  });

  const futureTask = await createTaskForUser(userA.id, {
    title: "Future project",
    subjectId: subjectA.id,
    type: "PROJECT",
    priority: "MEDIUM",
    status: "NOT_STARTED",
    dueDate: futureDueDate,
  });

  await createTaskForUser(userA.id, {
    title: "Completed reading",
    subjectId: subjectA.id,
    type: "READING",
    priority: "LOW",
    status: "COMPLETED",
    dueDate: overdueDueDate,
  });

  await createTaskForUser(userB.id, {
    title: "Other user task",
    subjectId: subjectB.id,
    type: "OTHER",
    priority: "HIGH",
    status: "NOT_STARTED",
    dueDate: todayDueDate,
  });

  const dashboardA = await getDashboardForUser(userA.id, tzOffset);

  if (dashboardA.counts.total !== 4) {
    throw new Error(`Expected 4 total tasks for user A, got ${dashboardA.counts.total}`);
  }

  if (dashboardA.counts.completed !== 1 || dashboardA.counts.pending !== 3) {
    throw new Error("Dashboard pending/completed counts are incorrect");
  }

  if (dashboardA.counts.overdue < 1) {
    throw new Error("Dashboard overdue count should include overdue pending tasks");
  }

  if (dashboardA.counts.completionPercentage !== 25) {
    throw new Error("Dashboard completion percentage should be 25%");
  }

  if (!dashboardA.priorityTasks.some((task) => task.id === overdueTask.id)) {
    throw new Error("Priority tasks widget should include urgent/high tasks");
  }

  if (!dashboardA.workloadOverview.some((item) => item.subjectId === subjectA.id)) {
    throw new Error("Workload overview should include subject A");
  }

  const dashboardB = await getDashboardForUser(userB.id, tzOffset);
  if (dashboardB.counts.total !== 1) {
    throw new Error("Dashboard data isolation failed for user B");
  }

  const calendarA = await getCalendarForUser(
    userA.id,
    now.getFullYear(),
    now.getMonth() + 1,
    tzOffset,
  );

  const todayKey = toLocalDateKey(new Date(todayDueDate), tzOffset);
  const todayTasks = calendarA.tasksByDate[todayKey] ?? [];

  if (!todayTasks.some((task) => task.id === todayTask.id)) {
    throw new Error("Calendar should include today's task on the correct date key");
  }

  await completeTaskForUser(userA.id, overdueTask.id);
  const dashboardAfterComplete = await getDashboardForUser(userA.id, tzOffset);

  if (dashboardAfterComplete.counts.completed !== 2) {
    throw new Error("Dashboard should refresh counts after task completion");
  }

  await reopenTaskForUser(userA.id, overdueTask.id);
  const dashboardAfterReopen = await getDashboardForUser(userA.id, tzOffset);

  if (dashboardAfterReopen.counts.completed !== 1) {
    throw new Error("Dashboard should refresh counts after task reopen");
  }

  await deleteTaskForUser(userA.id, futureTask.id);
  const dashboardAfterDelete = await getDashboardForUser(userA.id, tzOffset);

  if (dashboardAfterDelete.counts.total !== 3) {
    throw new Error("Dashboard should refresh counts after task deletion");
  }

  await db.task.deleteMany({
    where: { userId: { in: [userA.id, userB.id] } },
  });
  await db.subject.deleteMany({
    where: { userId: { in: [userA.id, userB.id] } },
  });
  await db.user.deleteMany({
    where: { id: { in: [userA.id, userB.id] } },
  });

  console.log("Phase 4 verification passed:");
  console.log("- Dashboard aggregation counts and widgets are correct");
  console.log("- Dashboard data is isolated per user");
  console.log("- Calendar groups tasks by due date");
  console.log("- Task complete/reopen/delete affect dashboard counts");
}

main()
  .catch((error) => {
    console.error("Phase 4 verification failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
