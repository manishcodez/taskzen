import "dotenv/config";

import { TaskStatus } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/auth/password";
import { db } from "../src/lib/db";
import { getClientTimezoneOffset, getThisWeekRangeUtc } from "../src/lib/utils/date-ranges";
import { createSubjectForUser } from "../src/services/subject.service";
import {
  completeTaskForUser,
  createTaskForUser,
} from "../src/services/task.service";
import { getAnalyticsForUser } from "../src/services/analytics.service";

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
  const userA = await createTestUser(`phase5-a-${suffix}@example.com`);
  const userB = await createTestUser(`phase5-b-${suffix}@example.com`);
  const tzOffset = getClientTimezoneOffset();
  const now = new Date();
  const { start: weekStart } = getThisWeekRangeUtc(tzOffset);

  const inWeekCompletion = (hoursAgo: number) =>
    new Date(Math.max(weekStart.getTime(), now.getTime() - hoursAgo * 60 * 60 * 1000));

  const subjectA = await createSubjectForUser(userA.id, {
    name: "Machine Learning",
    color: "#6366f1",
  });
  const subjectB = await createSubjectForUser(userB.id, {
    name: "Biology",
    color: "#22c55e",
  });

  const yesterday = inWeekCompletion(6);
  const twoDaysAgo = inWeekCompletion(12);

  await createTaskForUser(userA.id, {
    title: "Pending assignment",
    subjectId: subjectA.id,
    type: "ASSIGNMENT",
    priority: "HIGH",
    status: "NOT_STARTED",
    dueDate: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
  });

  const completedToday = await createTaskForUser(userA.id, {
    title: "Completed today",
    subjectId: subjectA.id,
    type: "HOMEWORK",
    priority: "MEDIUM",
    status: "NOT_STARTED",
  });
  await completeTaskForUser(userA.id, completedToday.id);

  const completedYesterday = await createTaskForUser(userA.id, {
    title: "Completed yesterday",
    subjectId: subjectA.id,
    type: "READING",
    priority: "LOW",
    status: "NOT_STARTED",
  });
  await db.task.update({
    where: { id: completedYesterday.id },
    data: { completedAt: yesterday, status: TaskStatus.COMPLETED },
  });

  const completedTwoDaysAgo = await createTaskForUser(userA.id, {
    title: "Completed two days ago",
    subjectId: subjectA.id,
    type: "OTHER",
    priority: "LOW",
    status: "NOT_STARTED",
  });
  await db.task.update({
    where: { id: completedTwoDaysAgo.id },
    data: { completedAt: twoDaysAgo, status: TaskStatus.COMPLETED },
  });

  await createTaskForUser(userB.id, {
    title: "Other user completed",
    subjectId: subjectB.id,
    type: "OTHER",
    priority: "LOW",
    status: "COMPLETED",
  });

  const analyticsA = await getAnalyticsForUser(userA.id, tzOffset);

  if (analyticsA.summary.totalTasks !== 4) {
    throw new Error(`Expected 4 tasks for user A, got ${analyticsA.summary.totalTasks}`);
  }

  if (analyticsA.summary.totalCompleted !== 3 || analyticsA.summary.pendingTasks !== 1) {
    throw new Error("Analytics completion counts are incorrect");
  }

  if (analyticsA.summary.completionRate !== 75) {
    throw new Error("Analytics completion rate should be 75%");
  }

  if (analyticsA.summary.completedThisWeek < 3) {
    throw new Error("Analytics completed-this-week count is incorrect");
  }

  if (analyticsA.summary.completedThisMonth < 3) {
    throw new Error("Analytics completed-this-month count is incorrect");
  }

  if (analyticsA.summary.overdueCount !== 1) {
    throw new Error("Analytics overdue count should be 1");
  }

  if (analyticsA.summary.productivityStreak < 1) {
    throw new Error("Analytics productivity streak should be at least 1");
  }

  if (!analyticsA.summary.mostProductiveDay) {
    throw new Error("Analytics most productive day should be calculated");
  }

  if (!analyticsA.weeklyCompletionTrend.some((item) => item.completed > 0)) {
    throw new Error("Weekly completion trend should include completed tasks");
  }

  if (
    !analyticsA.subjectWorkload.some(
      (item) => item.subjectId === subjectA.id && item.completed === 3 && item.pending === 1,
    )
  ) {
    throw new Error("Subject workload breakdown is incorrect");
  }

  const analyticsB = await getAnalyticsForUser(userB.id, tzOffset);
  if (analyticsB.summary.totalTasks !== 1) {
    throw new Error("Analytics data isolation failed for user B");
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

  console.log("Phase 5 verification passed:");
  console.log("- Analytics summary calculations are correct");
  console.log("- Weekly trend and subject workload are populated");
  console.log("- Productivity streak and most productive day are calculated");
  console.log("- Analytics data is isolated per user");
}

main()
  .catch((error) => {
    console.error("Phase 5 verification failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
