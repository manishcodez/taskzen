import "dotenv/config";

import { assertDbTestsAllowed } from "./lib/db-test-guard";

import { hashPassword } from "../src/lib/auth/password";
import { db } from "../src/lib/db";
import { AppError } from "../src/lib/api-response";
import { createSubjectForUser } from "../src/services/subject.service";
import {
  completeTaskForUser,
  createTaskForUser,
  deleteTaskForUser,
  getTaskForUser,
  listTasksForUser,
  reopenTaskForUser,
  updateTaskForUser,
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

async function main() {
  assertDbTestsAllowed("verify-phase3");

  const suffix = Date.now();
  const userA = await createTestUser(`phase3-a-${suffix}@example.com`);
  const userB = await createTestUser(`phase3-b-${suffix}@example.com`);

  const subjectA = await createSubjectForUser(userA.id, {
    name: "Data Structures",
    code: "CS201",
    color: "#6366f1",
  });
  const subjectB = await createSubjectForUser(userB.id, {
    name: "Physics",
    color: "#22c55e",
  });

  const overdueDueDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const futureDueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const created = await createTaskForUser(userA.id, {
    title: "Phase 3 verification task",
    description: "Searchable description keyword alpha",
    subjectId: subjectA.id,
    type: "ASSIGNMENT",
    priority: "HIGH",
    status: "NOT_STARTED",
    dueDate: overdueDueDate,
    estimatedTimeMinutes: 90,
    notes: "Verification notes",
  });

  if (!created.isOverdue) {
    throw new Error("Expected newly created past-due task to be overdue");
  }

  const fetched = await getTaskForUser(userA.id, created.id);
  if (fetched.title !== created.title) {
    throw new Error("Task read failed");
  }

  await expectNotFound(
    () => getTaskForUser(userB.id, created.id),
    "Cross-user task access",
  );

  await expectNotFound(
    () =>
      createTaskForUser(userA.id, {
        title: "Invalid subject task",
        subjectId: subjectB.id,
        type: "OTHER",
        priority: "LOW",
        status: "NOT_STARTED",
      }),
    "Cross-user subject assignment on create",
  );

  const updated = await updateTaskForUser(userA.id, created.id, {
    title: "Updated Phase 3 task",
    status: "IN_PROGRESS",
  });

  if (updated.status !== "IN_PROGRESS") {
    throw new Error("Task update failed");
  }

  await expectNotFound(
    () =>
      updateTaskForUser(userB.id, created.id, {
        title: "Blocked update",
      }),
    "Cross-user task update",
  );

  await expectNotFound(
    () =>
      updateTaskForUser(userA.id, created.id, {
        subjectId: subjectB.id,
      }),
    "Cross-user subject assignment on update",
  );

  const completed = await completeTaskForUser(userA.id, created.id);
  if (completed.status !== "COMPLETED" || !completed.completedAt || completed.isOverdue) {
    throw new Error("Task completion state is inconsistent");
  }

  const reopened = await reopenTaskForUser(userA.id, created.id);
  if (reopened.status !== "NOT_STARTED" || reopened.completedAt !== null) {
    throw new Error("Task reopen state is inconsistent");
  }

  if (!reopened.isOverdue) {
    throw new Error("Expected reopened overdue task to remain overdue");
  }

  await createTaskForUser(userA.id, {
    title: "Future task beta",
    description: "Another searchable task",
    subjectId: subjectA.id,
    type: "HOMEWORK",
    priority: "MEDIUM",
    status: "NOT_STARTED",
    dueDate: futureDueDate,
  });

  const searchResults = await listTasksForUser(userA.id, {
    q: "alpha",
    page: 1,
    limit: 10,
    sortBy: "dueDate",
    sortOrder: "asc",
  });

  if (searchResults.items.length !== 1 || searchResults.items[0]?.id !== created.id) {
    throw new Error("Task search filter failed");
  }

  const overdueResults = await listTasksForUser(userA.id, {
    overdue: "true",
    page: 1,
    limit: 10,
    sortBy: "dueDate",
    sortOrder: "asc",
  });

  if (!overdueResults.items.some((task) => task.id === created.id)) {
    throw new Error("Overdue filter failed");
  }

  const paginated = await listTasksForUser(userA.id, {
    page: 1,
    limit: 1,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  if (paginated.pagination.total < 2 || paginated.items.length !== 1) {
    throw new Error("Pagination failed");
  }

  await expectNotFound(
    () => completeTaskForUser(userB.id, created.id),
    "Cross-user task complete",
  );

  await expectNotFound(
    () => reopenTaskForUser(userB.id, created.id),
    "Cross-user task reopen",
  );

  await deleteTaskForUser(userA.id, created.id);

  await expectNotFound(
    () => getTaskForUser(userA.id, created.id),
    "Task delete verification",
  );

  await db.task.deleteMany({
    where: { userId: { in: [userA.id, userB.id] } },
  });
  await db.subject.deleteMany({
    where: { userId: { in: [userA.id, userB.id] } },
  });
  await db.user.deleteMany({
    where: { id: { in: [userA.id, userB.id] } },
  });

  console.log("Phase 3 verification passed:");
  console.log("- Task CRUD works");
  console.log("- Complete/reopen maintain consistent completion state");
  console.log("- Cross-user task access returns 404");
  console.log("- Cross-user subject assignment returns 404");
  console.log("- Overdue is computed and filterable");
  console.log("- Search and pagination work");
}

main()
  .catch((error) => {
    console.error("Phase 3 verification failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
