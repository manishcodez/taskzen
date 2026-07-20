import "dotenv/config";

import { assertDbTestsAllowed } from "./lib/db-test-guard";
import { config } from "dotenv";

config({ path: ".env.local", override: true });

import { TaskPriority, TaskStatus, TaskType } from "../src/generated/prisma/client";
import { isAdminUser } from "../src/lib/auth/admin";
import { AUTH_COOKIE_ACCESS } from "../src/lib/auth/constants";
import { signAccessToken } from "../src/lib/auth/jwt";
import { hashPassword } from "../src/lib/auth/password";
import { toSafeUser } from "../src/lib/auth/session";
import { db } from "../src/lib/db";
import {
  getAdminActivityStats,
  getAdminOverviewStats,
  getAdminProductAnalytics,
  getAdminSettingsInfo,
  getAdminSystemHealth,
  getAdminUserAnalytics,
} from "../src/services/admin.service";

const BASE = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";

const FORBIDDEN_RESPONSE_KEYS = [
  "password",
  "passwordHash",
  "title",
  "description",
  "notes",
  "subjectName",
  "JWT_SECRET",
  "DATABASE_URL",
  "JWT_REFRESH_SECRET",
] as const;

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function scanForForbiddenContent(payload: unknown, label: string) {
  const serialized = JSON.stringify(payload).toLowerCase();

  for (const key of FORBIDDEN_RESPONSE_KEYS) {
    assert(!serialized.includes(`"${key.toLowerCase()}"`), `${label}: forbidden key "${key}" found`);
  }

  assert(!serialized.includes("@example.com"), `${label}: user email leaked`);
  assert(!serialized.includes("postgresql://"), `${label}: database URL leaked`);
}

async function createTestUser(email: string) {
  return db.user.create({
    data: {
      email,
      passwordHash: await hashPassword("password123"),
      name: "Private User Name",
    },
  });
}

async function createPrivateContent(userId: string) {
  const subject = await db.subject.create({
    data: {
      userId,
      name: "Secret Subject Name",
      color: "#6366f1",
      description: "Secret subject description",
    },
  });

  await db.task.create({
    data: {
      userId,
      subjectId: subject.id,
      title: "Secret Task Title",
      description: "Secret task description",
      notes: "Secret personal notes",
      type: TaskType.ASSIGNMENT,
      priority: TaskPriority.HIGH,
      status: TaskStatus.NOT_STARTED,
    },
  });
}

function sessionCookieForUser(user: { id: string; email: string; tokenVersion: number }): string {
  const token = signAccessToken({
    sub: user.id,
    email: user.email,
    tokenVersion: user.tokenVersion,
  });
  return `${AUTH_COOKIE_ACCESS}=${encodeURIComponent(token)}`;
}

async function runServiceTests(suffix: number) {
  const previousAdminEmail = process.env.ADMIN_USER_EMAIL;
  const adminEmail = `admin-verify-${suffix}@example.com`;
  const userEmail = `user-verify-${suffix}@example.com`;

  process.env.ADMIN_USER_EMAIL = adminEmail;

  try {
    const adminUser = await createTestUser(adminEmail);
    const normalUser = await createTestUser(userEmail);

    await createPrivateContent(normalUser.id);

    const safeAdmin = toSafeUser(adminUser);
    const safeNormal = toSafeUser(normalUser);

    assert(safeAdmin.isAdmin === true, "Admin safe user must have isAdmin=true");
    assert(safeNormal.isAdmin === false, "Normal safe user must have isAdmin=false");
    assert(isAdminUser(safeAdmin), "isAdminUser must recognize admin email");
    assert(!isAdminUser(safeNormal), "isAdminUser must reject normal email");

    const overview = await getAdminOverviewStats();
    assert(typeof overview.totalUsers === "number", "Overview must include totalUsers");
    assert(typeof overview.completionRate === "number", "Overview must include completionRate");
    scanForForbiddenContent(overview, "overview service");

    const users = await getAdminUserAnalytics();
    scanForForbiddenContent(users, "user analytics service");

    const product = await getAdminProductAnalytics();
    scanForForbiddenContent(product, "product analytics service");

    const health = await getAdminSystemHealth();
    scanForForbiddenContent(health, "system health service");
    assert(!JSON.stringify(health).includes("postgresql://"), "Health must not expose DB URL");

    const activity = await getAdminActivityStats();
    scanForForbiddenContent(activity, "activity service");

    const settings = await getAdminSettingsInfo();
    scanForForbiddenContent(settings, "settings service");
    assert(settings.adminAccess.currentUserIsAdmin === true, "Settings must confirm admin context");
    assert(
      settings.analytics.excludesSyntheticTestAccounts === true,
      "Settings must document synthetic account exclusion",
    );

    await db.user.deleteMany({
      where: { email: { in: [adminEmail, userEmail] } },
    });
  } finally {
    if (previousAdminEmail === undefined) {
      delete process.env.ADMIN_USER_EMAIL;
    } else {
      process.env.ADMIN_USER_EMAIL = previousAdminEmail;
    }
  }
}

async function runHttpTests() {
  const configuredAdminEmail = process.env.ADMIN_USER_EMAIL?.trim().toLowerCase();

  if (!configuredAdminEmail) {
    throw new Error(
      "ADMIN_USER_EMAIL is not configured. Set it in .env.local and restart the dev server.",
    );
  }

  const suffix = Date.now();
  const userEmail = `user-http-${suffix}@example.com`;

  const normalUser = await createTestUser(userEmail);

  let adminUser = await db.user.findUnique({ where: { email: configuredAdminEmail } });
  if (!adminUser) {
    adminUser = await createTestUser(configuredAdminEmail);
  }

  // Session cookies are signed with the existing JWT secret (no password required).
  const normalCookie = sessionCookieForUser(normalUser);
  const adminCookie = sessionCookieForUser(adminUser);

  const normalMe = await fetch(`${BASE}/api/auth/me`, { headers: { Cookie: normalCookie } });
  const normalMeBody = await normalMe.json();
  assert(normalMe.ok, "Normal /api/auth/me failed");
  assert(normalMeBody.user?.isAdmin === false, "Normal user must not be admin in /api/auth/me");

  const adminMe = await fetch(`${BASE}/api/auth/me`, { headers: { Cookie: adminCookie } });
  const adminMeBody = await adminMe.json();
  assert(adminMe.ok, "Admin /api/auth/me failed");
  assert(adminMeBody.user?.isAdmin === true, "Admin user must be admin in /api/auth/me");

  const normalAdminApi = await fetch(`${BASE}/api/admin/overview`, {
    headers: { Cookie: normalCookie },
  });
  assert(normalAdminApi.status === 403, "Normal user must receive 403 from admin API");

  const adminOverview = await fetch(`${BASE}/api/admin/overview`, {
    headers: { Cookie: adminCookie },
  });
  const adminOverviewBody = await adminOverview.json();
  assert(adminOverview.ok, "Admin overview API must succeed");
  scanForForbiddenContent(adminOverviewBody, "admin overview API");

  const adminPageNormal = await fetch(`${BASE}/admin`, {
    redirect: "manual",
    headers: { Cookie: normalCookie },
  });
  assert(
    adminPageNormal.status === 307 ||
      adminPageNormal.status === 308 ||
      adminPageNormal.status === 302,
    "Normal user must be redirected from /admin",
  );

  const adminPageAdmin = await fetch(`${BASE}/admin`, {
    redirect: "manual",
    headers: { Cookie: adminCookie },
  });
  assert(adminPageAdmin.status === 200, "Admin user must access /admin");

  await db.user.deleteMany({
    where: { email: userEmail },
  });
}

async function main() {
  assertDbTestsAllowed("verify-admin");

  const suffix = Date.now();

  console.log("Admin verification: service-layer tests...");
  await runServiceTests(suffix);
  console.log("Admin verification: service-layer tests passed.");

  const health = await fetch(`${BASE}/`);
  assert(
    health.ok || health.status === 307 || health.status === 308,
    `Dev server not healthy at ${BASE} (status ${health.status})`,
  );

  console.log(`Admin verification: HTTP tests against ${BASE}...`);
  await runHttpTests();
  console.log("Admin verification: HTTP tests passed.");
  console.log("Admin verification complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
