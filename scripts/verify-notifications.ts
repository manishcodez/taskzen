/**
 * Email notification eligibility + delivery verification.
 * TASKZEN_ALLOW_DB_TESTS=1 EMAIL_PROVIDER=memory npx tsx scripts/verify-notifications.ts
 */

import "dotenv/config";
import { config } from "dotenv";

config({ path: ".env.local", override: true });

process.env.EMAIL_PROVIDER = "memory";

import { assertDbTestsAllowed } from "./lib/db-test-guard";
import { TaskStatus } from "../src/generated/prisma/client";
import { clearCapturedEmails, getCapturedEmails } from "../src/lib/email/provider";
import { hashPassword } from "../src/lib/auth/password";
import { db } from "../src/lib/db";
import {
  dueDateKey,
  isEligibleForDeadlineReminder,
  isEligibleForOverdueNotification,
  processTaskNotificationEmails,
} from "../src/services/task-notification.service";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  assertDbTestsAllowed("verify-notifications");

  const suffix = Date.now();
  const email = `notify-${suffix}@example.com`;
  const otherEmail = `notify-other-${suffix}@example.com`;
  let userId: string | null = null;
  let otherUserId: string | null = null;

  try {
    const now = new Date("2026-07-21T12:00:00.000Z");

    assert(
      isEligibleForDeadlineReminder({
        status: TaskStatus.NOT_STARTED,
        dueDate: new Date("2026-07-22T10:00:00.000Z"),
        now,
      }),
      "task due in ~22h should be eligible for reminder",
    );
    assert(
      !isEligibleForDeadlineReminder({
        status: TaskStatus.COMPLETED,
        dueDate: new Date("2026-07-22T10:00:00.000Z"),
        now,
      }),
      "completed task must not get reminder",
    );
    assert(
      !isEligibleForDeadlineReminder({
        status: TaskStatus.NOT_STARTED,
        dueDate: new Date("2026-07-25T10:00:00.000Z"),
        now,
      }),
      "task due in 4 days must not get reminder yet",
    );
    assert(
      isEligibleForOverdueNotification({
        status: TaskStatus.IN_PROGRESS,
        dueDate: new Date("2026-07-20T10:00:00.000Z"),
        now,
      }),
      "past-due incomplete task should be overdue-eligible",
    );
    assert(
      !isEligibleForOverdueNotification({
        status: TaskStatus.COMPLETED,
        dueDate: new Date("2026-07-20T10:00:00.000Z"),
        now,
      }),
      "completed overdue task must not notify",
    );
    console.log("PASS eligibility helpers");

    const passwordHash = await hashPassword("notify-test-password-123");
    const user = await db.user.create({
      data: {
        email,
        passwordHash,
        name: "Notify Tester",
        emailDeadlineReminders: true,
        emailOverdueNotifications: true,
      },
    });
    userId = user.id;

    const other = await db.user.create({
      data: {
        email: otherEmail,
        passwordHash,
        name: "Other User",
      },
    });
    otherUserId = other.id;

    const subject = await db.subject.create({
      data: {
        userId: user.id,
        name: `Notify Subject ${suffix}`,
        color: "#5b8def",
      },
    });

    const reminderDue = new Date(now.getTime() + 20 * 60 * 60 * 1000);
    const overdueDue = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const completedDue = new Date(now.getTime() + 20 * 60 * 60 * 1000);

    const reminderTask = await db.task.create({
      data: {
        userId: user.id,
        subjectId: subject.id,
        title: "Reminder task",
        status: TaskStatus.NOT_STARTED,
        dueDate: reminderDue,
      },
    });
    const overdueTask = await db.task.create({
      data: {
        userId: user.id,
        subjectId: subject.id,
        title: "Overdue task",
        status: TaskStatus.IN_PROGRESS,
        dueDate: overdueDue,
      },
    });
    await db.task.create({
      data: {
        userId: user.id,
        subjectId: subject.id,
        title: "Completed soon task",
        status: TaskStatus.COMPLETED,
        dueDate: completedDue,
        completedAt: now,
      },
    });

    clearCapturedEmails();
    let result = await processTaskNotificationEmails(now);
    assert(result.deadlineRemindersSent === 1, "expected one deadline reminder");
    assert(result.overdueNotificationsSent === 1, "expected one overdue notification");
    assert(getCapturedEmails().length === 2, "expected two captured emails");
    console.log("PASS first notification send");

    clearCapturedEmails();
    result = await processTaskNotificationEmails(now);
    assert(result.deadlineRemindersSent === 0, "duplicate reminder must not send");
    assert(result.overdueNotificationsSent === 0, "duplicate overdue must not send");
    assert(result.skippedDuplicates >= 2, "expected duplicate skips");
    assert(getCapturedEmails().length === 0, "no emails on duplicate run");
    console.log("PASS duplicate prevention");

    await db.user.update({
      where: { id: user.id },
      data: {
        emailDeadlineReminders: false,
        emailOverdueNotifications: false,
      },
    });

    // New tasks with different due keys so prefs gate is tested (existing deliveries already recorded)
    const prefReminderDue = new Date(now.getTime() + 18 * 60 * 60 * 1000);
    const prefOverdueDue = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    await db.task.create({
      data: {
        userId: user.id,
        subjectId: subject.id,
        title: "Pref reminder task",
        status: TaskStatus.NOT_STARTED,
        dueDate: prefReminderDue,
      },
    });
    await db.task.create({
      data: {
        userId: user.id,
        subjectId: subject.id,
        title: "Pref overdue task",
        status: TaskStatus.NOT_STARTED,
        dueDate: prefOverdueDue,
      },
    });

    clearCapturedEmails();
    result = await processTaskNotificationEmails(now);
    assert(result.deadlineRemindersSent === 0, "disabled reminder pref must block send");
    assert(result.overdueNotificationsSent === 0, "disabled overdue pref must block send");
    assert(getCapturedEmails().length === 0, "no emails when prefs disabled");
    console.log("PASS preference disable");

    await db.user.update({
      where: { id: user.id },
      data: {
        emailDeadlineReminders: true,
        emailOverdueNotifications: true,
      },
    });

    clearCapturedEmails();
    result = await processTaskNotificationEmails(now);
    assert(result.deadlineRemindersSent === 1, "re-enabled reminder should send for new due key");
    assert(result.overdueNotificationsSent === 1, "re-enabled overdue should send for new due key");
    console.log("PASS preference re-enable");

    const otherDeliveries = await db.emailNotificationDelivery.count({
      where: { userId: other.id },
    });
    assert(otherDeliveries === 0, "other user must not receive deliveries");

    const ownDeliveries = await db.emailNotificationDelivery.findMany({
      where: { userId: user.id },
    });
    assert(
      ownDeliveries.every((row) => row.userId === user.id),
      "deliveries must belong to owning user",
    );
    assert(
      ownDeliveries.some((row) => row.taskId === reminderTask.id),
      "reminder delivery should reference reminder task",
    );
    assert(
      ownDeliveries.some((row) => row.taskId === overdueTask.id),
      "overdue delivery should reference overdue task",
    );
    assert(dueDateKey(reminderDue).includes("T"), "dueDateKey should be ISO");
    console.log("PASS ownership isolation");

    console.log("verify-notifications: ALL CHECKS PASSED");
  } finally {
    if (userId) {
      await db.user.delete({ where: { id: userId } }).catch(() => undefined);
    }
    if (otherUserId) {
      await db.user.delete({ where: { id: otherUserId } }).catch(() => undefined);
    }
    await db.$disconnect();
  }
}

main().catch(async (error) => {
  console.error(error);
  await db.$disconnect();
  process.exit(1);
});
