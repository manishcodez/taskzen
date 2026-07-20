import "dotenv/config";
import { config } from "dotenv";

config({ path: ".env.local", override: true });

import { isSyntheticTestEmail } from "../src/lib/analytics/genuine-usage";
import { db } from "../src/lib/db";

const ADMIN_EMAIL = process.env.ADMIN_USER_EMAIL?.trim().toLowerCase();

if (!ADMIN_EMAIL) {
  throw new Error("ADMIN_USER_EMAIL must be set before running cleanup");
}

/**
 * One-time cleanup of confirmed automated-test accounts.
 * Deletes ONLY @example.com synthetic users. Never deletes the admin account
 * or any non-@example.com email.
 */
async function main() {
  const dryRun = process.argv.includes("--dry-run");

  const candidates = await db.user.findMany({
    where: {
      email: { endsWith: "@example.com", mode: "insensitive" },
    },
    select: {
      id: true,
      email: true,
      createdAt: true,
      _count: { select: { subjects: true, tasks: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const toDelete = candidates.filter((user) => {
    const email = user.email.toLowerCase();
    if (email === ADMIN_EMAIL) return false;
    return isSyntheticTestEmail(email);
  });

  const blocked = candidates.filter((user) => user.email.toLowerCase() === ADMIN_EMAIL);

  console.log(
    JSON.stringify(
      {
        dryRun,
        adminEmailProtected: ADMIN_EMAIL,
        candidateCount: candidates.length,
        willDelete: toDelete.length,
        blockedAdminMatches: blocked.length,
        deleteEmails: toDelete.map((user) => user.email.toLowerCase()),
        subjectCount: toDelete.reduce((sum, user) => sum + user._count.subjects, 0),
        taskCount: toDelete.reduce((sum, user) => sum + user._count.tasks, 0),
      },
      null,
      2,
    ),
  );

  if (dryRun) {
    console.log("Dry run only — no rows deleted.");
    await db.$disconnect();
    return;
  }

  if (toDelete.length === 0) {
    console.log("Nothing to delete.");
    await db.$disconnect();
    return;
  }

  const ids = toDelete.map((user) => user.id);
  const result = await db.user.deleteMany({
    where: {
      id: { in: ids },
      email: { endsWith: "@example.com", mode: "insensitive" },
      NOT: { email: { equals: ADMIN_EMAIL, mode: "insensitive" } },
    },
  });

  const remaining = await db.user.count();
  const remainingExample = await db.user.count({
    where: { email: { endsWith: "@example.com", mode: "insensitive" } },
  });
  const adminStillPresent = Boolean(
    await db.user.findFirst({
      where: { email: { equals: ADMIN_EMAIL, mode: "insensitive" } },
      select: { id: true },
    }),
  );

  console.log(
    JSON.stringify(
      {
        deletedUsers: result.count,
        remainingUsers: remaining,
        remainingExampleDotComUsers: remainingExample,
        adminStillPresent,
      },
      null,
      2,
    ),
  );

  if (!adminStillPresent) {
    throw new Error("CRITICAL: admin account missing after cleanup");
  }

  await db.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await db.$disconnect();
  process.exit(1);
});
