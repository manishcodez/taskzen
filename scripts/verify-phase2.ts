import "dotenv/config";

import { assertDbTestsAllowed } from "./lib/db-test-guard";
import { hashPassword } from "../src/lib/auth/password";
import { db } from "../src/lib/db";
import {
  createSubjectForUser,
  deleteSubjectForUser,
  getSubjectForUser,
  updateProfileForUser,
} from "../src/services/subject.service";
import { AppError } from "../src/lib/api-response";

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
  assertDbTestsAllowed("verify-phase2");

  const suffix = Date.now();
  const userA = await createTestUser(`phase2-a-${suffix}@example.com`);
  const userB = await createTestUser(`phase2-b-${suffix}@example.com`);
  const userIds = [userA.id, userB.id];

  try {
    const subject = await createSubjectForUser(userA.id, {
      name: "Operating Systems",
      code: "CS301",
      color: "#6366f1",
      description: "Phase 2 verification subject",
    });

    await expectNotFound(
      () => getSubjectForUser(userB.id, subject.id),
      "Cross-user subject access",
    );

    const updatedProfile = await updateProfileForUser(userA.id, {
      course: "Computer Science",
      college: "Taskzen University",
      semester: "5",
      academicYear: "2025-2026",
      profilePhotoUrl: "https://example.com/avatar.png",
    });

    if (updatedProfile.course !== "Computer Science") {
      throw new Error("Profile update failed");
    }

    const taskSubject = await db.subject.create({
      data: {
        userId: userA.id,
        name: "Database Management",
        color: "#22c55e",
      },
    });

    await db.task.create({
      data: {
        userId: userA.id,
        subjectId: taskSubject.id,
        title: "Phase 2 blocking task",
        type: "ASSIGNMENT",
        priority: "HIGH",
        status: "NOT_STARTED",
      },
    });

    await expectConflict(
      () => deleteSubjectForUser(userA.id, taskSubject.id),
      "Delete subject with tasks",
    );

    await deleteSubjectForUser(userA.id, subject.id);

    console.log("Phase 2 verification passed:");
    console.log("- Subject ownership isolation returns 404");
    console.log("- Subject deletion blocked when tasks exist returns 409");
    console.log("- Profile updates persist correctly");
  } finally {
    await db.task.deleteMany({ where: { userId: { in: userIds } } });
    await db.subject.deleteMany({ where: { userId: { in: userIds } } });
    await db.user.deleteMany({ where: { id: { in: userIds } } });
  }
}

main()
  .catch((error) => {
    console.error("Phase 2 verification failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
