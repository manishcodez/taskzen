/**
 * Helpers for privacy-safe admin analytics that reflect genuine Taskzen usage.
 *
 * Automated verification scripts historically created accounts on the reserved
 * RFC 2606 domain `@example.com`. Those must never inflate production metrics.
 */

export const SYNTHETIC_TEST_EMAIL_DOMAIN = "example.com";

/** Prisma where-clause fragment: include only non-synthetic users. */
export const genuineUserWhere = {
  NOT: {
    email: {
      endsWith: `@${SYNTHETIC_TEST_EMAIL_DOMAIN}`,
      mode: "insensitive" as const,
    },
  },
};

/** Prisma where-clause fragment: rows owned by genuine users only. */
export const ownedByGenuineUserWhere = {
  user: genuineUserWhere,
};

export function isSyntheticTestEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith(`@${SYNTHETIC_TEST_EMAIL_DOMAIN}`);
}
