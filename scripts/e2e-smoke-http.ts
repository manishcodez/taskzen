/**
 * HTTP smoke tests against the running Taskzen dev server.
 * Run while `npm run dev` is active: npx tsx scripts/e2e-smoke-http.ts
 */

const BASE = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";

type SmokeResult = {
  name: string;
  ok: boolean;
  detail: string;
};

const results: SmokeResult[] = [];

function record(name: string, ok: boolean, detail: string) {
  results.push({ name, ok, detail });
}

async function fetchStatus(path: string, init?: RequestInit) {
  const response = await fetch(`${BASE}${path}`, {
    redirect: "manual",
    ...init,
  });
  return response;
}

async function main() {
  const publicRoutes = ["/", "/login", "/register"];

  for (const route of publicRoutes) {
    try {
      const response = await fetchStatus(route);
      record(`GET ${route}`, response.status === 200, `status ${response.status}`);
    } catch (error) {
      record(`GET ${route}`, false, error instanceof Error ? error.message : "request failed");
    }
  }

  const protectedRoutes = ["/dashboard", "/tasks", "/subjects", "/calendar", "/analytics", "/settings"];

  for (const route of protectedRoutes) {
    try {
      const response = await fetchStatus(route);
      const ok = response.status === 307 || response.status === 308 || response.status === 302;
      record(
        `GET ${route} unauthenticated`,
        ok,
        ok ? `redirect ${response.status}` : `expected redirect, got ${response.status}`,
      );
    } catch (error) {
      record(`GET ${route} unauthenticated`, false, error instanceof Error ? error.message : "failed");
    }
  }

  const suffix = Date.now();
  const email = `smoke-${suffix}@example.com`;
  const password = "smoke-test-password-123";

  let cookieHeader = "";

  try {
    const registerResponse = await fetch(`${BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name: "Smoke Tester", password }),
    });

    const registerBody = await registerResponse.json();
    const registerOk = registerResponse.ok && registerBody.user?.email === email;
    record("POST /api/auth/register", registerOk, registerOk ? "user created" : "register failed");

    const setCookie = registerResponse.headers.getSetCookie?.() ?? [];
    cookieHeader = setCookie.map((item) => item.split(";")[0]).join("; ");
  } catch (error) {
    record("POST /api/auth/register", false, error instanceof Error ? error.message : "failed");
  }

  if (cookieHeader) {
    try {
      const meResponse = await fetch(`${BASE}/api/auth/me`, {
        headers: { Cookie: cookieHeader },
      });
      const meBody = await meResponse.json();
      record(
        "GET /api/auth/me",
        meResponse.ok && meBody.user?.email === email,
        meResponse.ok ? "authenticated" : "me failed",
      );
    } catch (error) {
      record("GET /api/auth/me", false, error instanceof Error ? error.message : "failed");
    }

    try {
      const dashboardResponse = await fetch(`${BASE}/api/dashboard`, {
        headers: { Cookie: cookieHeader },
      });
      record(
        "GET /api/dashboard",
        dashboardResponse.ok,
        dashboardResponse.ok ? "ok" : `status ${dashboardResponse.status}`,
      );
    } catch (error) {
      record("GET /api/dashboard", false, error instanceof Error ? error.message : "failed");
    }

    try {
      const logoutResponse = await fetch(`${BASE}/api/auth/logout`, {
        method: "POST",
        headers: { Cookie: cookieHeader },
      });
      record("POST /api/auth/logout", logoutResponse.ok, logoutResponse.ok ? "logged out" : "logout failed");
    } catch (error) {
      record("POST /api/auth/logout", false, error instanceof Error ? error.message : "failed");
    }

    try {
      const meAfterLogout = await fetch(`${BASE}/api/auth/me`);
      record(
        "GET /api/auth/me after logout",
        meAfterLogout.status === 401,
        `status ${meAfterLogout.status}`,
      );
    } catch (error) {
      record("GET /api/auth/me after logout", false, error instanceof Error ? error.message : "failed");
    }
  }

  const failed = results.filter((item) => !item.ok);
  console.log(JSON.stringify({ base: BASE, results }, null, 2));

  if (failed.length > 0) {
    console.error(`Smoke tests failed: ${failed.length}/${results.length}`);
    process.exit(1);
  }

  console.log(`Smoke tests passed: ${results.length}/${results.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
