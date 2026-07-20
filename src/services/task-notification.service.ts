import {
  EmailNotificationType,
  TaskStatus,
} from "@/generated/prisma/client";

import { db } from "@/lib/db";
import {
  sendDeadlineReminderEmail,
  sendOverdueTaskEmail,
} from "@/lib/email/send-task-notification";

const REMINDER_WINDOW_MS = 24 * 60 * 60 * 1000;
const BATCH_LIMIT = 100;

export function dueDateKey(dueDate: Date): string {
  return dueDate.toISOString();
}

export function isEligibleForDeadlineReminder(input: {
  status: TaskStatus;
  dueDate: Date | null;
  now?: Date;
}): boolean {
  if (!input.dueDate || input.status === TaskStatus.COMPLETED) {
    return false;
  }

  const now = input.now ?? new Date();
  const reminderAt = input.dueDate.getTime() - REMINDER_WINDOW_MS;
  return now.getTime() >= reminderAt && now.getTime() < input.dueDate.getTime();
}

export function isEligibleForOverdueNotification(input: {
  status: TaskStatus;
  dueDate: Date | null;
  now?: Date;
}): boolean {
  if (!input.dueDate || input.status === TaskStatus.COMPLETED) {
    return false;
  }

  const now = input.now ?? new Date();
  return now.getTime() > input.dueDate.getTime();
}

export type NotificationRunResult = {
  deadlineRemindersSent: number;
  overdueNotificationsSent: number;
  skippedDuplicates: number;
  skippedByPreference: number;
  failures: number;
};

async function alreadySent(
  taskId: string,
  type: EmailNotificationType,
  key: string,
): Promise<boolean> {
  const existing = await db.emailNotificationDelivery.findUnique({
    where: {
      taskId_type_dueDateKey: {
        taskId,
        type,
        dueDateKey: key,
      },
    },
    select: { id: true },
  });
  return Boolean(existing);
}

async function recordDelivery(input: {
  userId: string;
  taskId: string;
  type: EmailNotificationType;
  dueDateKey: string;
}) {
  try {
    await db.emailNotificationDelivery.create({
      data: input,
    });
    return { created: true as const };
  } catch {
    // Unique constraint race — treat as duplicate.
    return { created: false as const };
  }
}

/**
 * Process deadline reminders and overdue notifications.
 * Safe to run repeatedly (hourly cron): duplicates are blocked by unique delivery records.
 */
export async function processTaskNotificationEmails(
  now = new Date(),
): Promise<NotificationRunResult> {
  const result: NotificationRunResult = {
    deadlineRemindersSent: 0,
    overdueNotificationsSent: 0,
    skippedDuplicates: 0,
    skippedByPreference: 0,
    failures: 0,
  };

  const reminderWindowStart = new Date(now.getTime());
  const reminderWindowEnd = new Date(now.getTime() + REMINDER_WINDOW_MS);

  // Due within the next 24h (reminder window open) and not yet past due.
  const reminderCandidates = await db.task.findMany({
    where: {
      status: { not: TaskStatus.COMPLETED },
      dueDate: {
        gt: reminderWindowStart,
        lte: reminderWindowEnd,
      },
      user: {
        emailDeadlineReminders: true,
      },
    },
    take: BATCH_LIMIT,
    select: {
      id: true,
      userId: true,
      title: true,
      status: true,
      dueDate: true,
      user: {
        select: {
          email: true,
          name: true,
          emailDeadlineReminders: true,
        },
      },
    },
  });

  for (const task of reminderCandidates) {
    if (!task.dueDate || !isEligibleForDeadlineReminder({ status: task.status, dueDate: task.dueDate, now })) {
      continue;
    }

    if (!task.user.emailDeadlineReminders) {
      result.skippedByPreference += 1;
      continue;
    }

    const key = dueDateKey(task.dueDate);
    if (await alreadySent(task.id, EmailNotificationType.DEADLINE_REMINDER, key)) {
      result.skippedDuplicates += 1;
      continue;
    }

    const recorded = await recordDelivery({
      userId: task.userId,
      taskId: task.id,
      type: EmailNotificationType.DEADLINE_REMINDER,
      dueDateKey: key,
    });

    if (!recorded.created) {
      result.skippedDuplicates += 1;
      continue;
    }

    try {
      await sendDeadlineReminderEmail({
        to: task.user.email,
        name: task.user.name,
        taskTitle: task.title,
        dueDate: task.dueDate,
        taskId: task.id,
      });
      result.deadlineRemindersSent += 1;
    } catch (error) {
      result.failures += 1;
      console.error(
        "Failed to send deadline reminder email.",
        error instanceof Error ? error.message : "Unknown email error",
      );
      await db.emailNotificationDelivery
        .deleteMany({
          where: {
            taskId: task.id,
            type: EmailNotificationType.DEADLINE_REMINDER,
            dueDateKey: key,
          },
        })
        .catch(() => undefined);
    }
  }

  const overdueCandidates = await db.task.findMany({
    where: {
      status: { not: TaskStatus.COMPLETED },
      dueDate: { lt: now },
      user: {
        emailOverdueNotifications: true,
      },
    },
    take: BATCH_LIMIT,
    select: {
      id: true,
      userId: true,
      title: true,
      status: true,
      dueDate: true,
      user: {
        select: {
          email: true,
          name: true,
          emailOverdueNotifications: true,
        },
      },
    },
  });

  for (const task of overdueCandidates) {
    if (!task.dueDate || !isEligibleForOverdueNotification({ status: task.status, dueDate: task.dueDate, now })) {
      continue;
    }

    if (!task.user.emailOverdueNotifications) {
      result.skippedByPreference += 1;
      continue;
    }

    const key = dueDateKey(task.dueDate);
    if (await alreadySent(task.id, EmailNotificationType.OVERDUE, key)) {
      result.skippedDuplicates += 1;
      continue;
    }

    const recorded = await recordDelivery({
      userId: task.userId,
      taskId: task.id,
      type: EmailNotificationType.OVERDUE,
      dueDateKey: key,
    });

    if (!recorded.created) {
      result.skippedDuplicates += 1;
      continue;
    }

    try {
      await sendOverdueTaskEmail({
        to: task.user.email,
        name: task.user.name,
        taskTitle: task.title,
        dueDate: task.dueDate,
        taskId: task.id,
      });
      result.overdueNotificationsSent += 1;
    } catch (error) {
      result.failures += 1;
      console.error(
        "Failed to send overdue notification email.",
        error instanceof Error ? error.message : "Unknown email error",
      );
      await db.emailNotificationDelivery
        .deleteMany({
          where: {
            taskId: task.id,
            type: EmailNotificationType.OVERDUE,
            dueDateKey: key,
          },
        })
        .catch(() => undefined);
    }
  }

  return result;
}
