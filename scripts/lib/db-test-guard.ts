/**
 * Safety guard for DB-writing verification scripts.
 *
 * Local `.env` / `.env.local` often points at the shared Neon database used by
 * production. Scripts must opt in explicitly so they cannot silently pollute
 * genuine usage analytics.
 */
export function assertDbTestsAllowed(scriptName: string): void {
  if (process.env.TASKZEN_ALLOW_DB_TESTS === "1") {
    return;
  }

  throw new Error(
    [
      `${scriptName} writes temporary users to DATABASE_URL.`,
      "Refusing to run because TASKZEN_ALLOW_DB_TESTS is not set to 1.",
      "Set TASKZEN_ALLOW_DB_TESTS=1 only when you intentionally accept writing",
      "and cleaning temporary @example.com test users on that database.",
      "Prefer a dedicated local/test database when possible.",
    ].join(" "),
  );
}
