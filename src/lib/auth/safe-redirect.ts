import { PROTECTED_ROUTE_PREFIXES } from "@/lib/auth/constants";

/**
 * Prevent open redirects from login `?redirect=` (e.g. `//evil.com`, absolute URLs).
 * Only same-origin relative paths under known app prefixes are allowed.
 */
export function getSafeRedirectPath(
  value: string | null | undefined,
  fallback = "/dashboard",
): string {
  if (!value) {
    return fallback;
  }

  const redirect = value.trim();

  if (!redirect.startsWith("/") || redirect.startsWith("//") || redirect.includes("\\")) {
    return fallback;
  }

  if (redirect.includes("://") || redirect.includes("@")) {
    return fallback;
  }

  const pathname = redirect.split(/[?#]/, 1)[0] ?? "";

  const isAllowed = PROTECTED_ROUTE_PREFIXES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  return isAllowed ? redirect : fallback;
}
