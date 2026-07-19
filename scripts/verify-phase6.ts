import "dotenv/config";

import { hashPassword, verifyPassword } from "../src/lib/auth/password";
import { toSafeUser } from "../src/lib/auth/session";
import { db } from "../src/lib/db";
import { AppError } from "../src/lib/api-response";
import { getClientTimezoneOffset } from "../src/lib/utils/date-ranges";
import { getAnalyticsForUser } from "../src/services/analytics.service";
import { getCalendarForUser } from "../src/services/calendar.service";
import { getDashboardForUser } from "../src/services/dashboard.service";
import {
  createSubjectForUser,
  deleteSubjectForUser,
  getSubjectForUser,
  updateProfileForUser,
} from "../src/services/subject.service";
import {
  completeTaskForUser,
  createTaskForUser,
  getTaskForUser,
  reopenTaskForUser,
} from "../src/services/task.service";

async function createTestUser(email: string) {
  return db.user.create({
    data: {
      email,
      passwordHash: await hashPassword("password123"),
      name: email.split("@")[0],
    },
  });
}

async function expectNotFound(fn: () => Promise<unknown>, label: string) {
  try {
    await fn();
    throw new Error(`${label}: expected NOT_FOUND`);
  } catch (error) {
    if (!(error instanceof AppError) || error.status !== 404) {
      throw error;
    }
  }
}

async function expectConflict(fn: () => Promise<unknown>, label: string) {
  try {
    await fn();
    throw new Error(`${label}: expected CONFLICT`);
  } catch (error) {
    if (!(error instanceof AppError) || error.status !== 409) {
      throw error;
    }
  }
}

async function main() {
  const suffix = Date.now();
  const userA = await createTestUser(`phase6-a-${suffix}@example.com`);
  const userB = await createTestUser(`phase6-b-${suffix}@example.com`);
  const tzOffset = getClientTimezoneOffset();

  const safeUser = toSafeUser(userA);
  if ("passwordHash" in safeUser) {
    throw new Error("Safe user must not expose password hash");
  }

  const isValid = await verifyPassword("password123", userA.passwordHash);
  if (!isValid) {
    throw new Error("bcrypt password verification failed");
  }

  const subjectA = await createSubjectForUser(userA.id, {
    name: "Security Audit Subject",
    color: "#6366f1",
  });
  const subjectB = await createSubjectForUser(userB.id, {
    name: "Other User Subject",
    color: "#22c55e",
  });

  const taskA = await createTaskForUser(userA.id, {
    title: "Phase 6 security task",
    subjectId: subjectA.id,
    type: "ASSIGNMENT",
    priority: "HIGH",
    status: "NOT_STARTED",
    dueDate: new Date(Date.now() + 86400000).toISOString(),
  });

  await updateProfileForUser(userA.id, {
    course: "Computer Science",
    college: "Taskzen University",
  });

  await expectNotFound(
    () => getSubjectForUser(userB.id, subjectA.id),
    "Cross-user subject read",
  );
  await expectNotFound(
    () => getTaskForUser(userB.id, taskA.id),
    "Cross-user task read",
  );
  await expectNotFound(
    () =>
      createTaskForUser(userA.id, {
        title: "Cross-user subject assignment",
        subjectId: subjectB.id,
        type: "OTHER",
        priority: "LOW",
        status: "NOT_STARTED",
      }),
    "Cross-user subject assignment",
  );

  const dashboardA = await getDashboardForUser(userA.id, tzOffset);
  const dashboardB = await getDashboardForUser(userB.id, tzOffset);

  if (dashboardA.counts.total < 1 || dashboardB.counts.total !== 0) {
    throw new Error("Dashboard ownership isolation failed");
  }

  const now = new Date();
  const calendarA = await getCalendarForUser(
    userA.id,
    now.getFullYear(),
    now.getMonth() + 1,
    tzOffset,
  );
  const calendarB = await getCalendarForUser(
    userB.id,
    now.getFullYear(),
    now.getMonth() + 1,
    tzOffset,
  );

  const calendarTaskCountA = Object.values(calendarA.tasksByDate).flat().length;
  const calendarTaskCountB = Object.values(calendarB.tasksByDate).flat().length;

  if (calendarTaskCountA < 1 || calendarTaskCountB !== 0) {
    throw new Error("Calendar ownership isolation failed");
  }

  await completeTaskForUser(userA.id, taskA.id);
  const analyticsA = await getAnalyticsForUser(userA.id, tzOffset);
  const analyticsB = await getAnalyticsForUser(userB.id, tzOffset);

  if (analyticsA.summary.totalCompleted < 1 || analyticsB.summary.totalCompleted !== 0) {
    throw new Error("Analytics ownership isolation failed");
  }

  await reopenTaskForUser(userA.id, taskA.id);

  await expectConflict(
    () => deleteSubjectForUser(userA.id, subjectA.id),
    "Delete subject with tasks",
  );

  await db.task.deleteMany({ where: { userId: { in: [userA.id, userB.id] } } });
  await db.subject.deleteMany({ where: { userId: { in: [userA.id, userB.id] } } });
  await db.user.deleteMany({ where: { id: { in: [userA.id, userB.id] } } });

  console.log("Phase 6 verification passed:");
  console.log("- Password hashing and safe user mapping verified");
  console.log("- Cross-user subject/task access returns 404");
  console.log("- Cross-user subject assignment returns 404");
  console.log("- Dashboard, calendar, and analytics data are user-scoped");
  console.log("- Subject deletion remains blocked when tasks exist");
}

main()
  .catch((error) => {
    console.error("Phase 6 verification failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
