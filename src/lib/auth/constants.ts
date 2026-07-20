export const AUTH_COOKIE_ACCESS = "taskzen_access_token";
export const AUTH_COOKIE_REFRESH = "taskzen_refresh_token";

export const ACCESS_TOKEN_EXPIRES_IN = "15m";
export const REFRESH_TOKEN_EXPIRES_IN = "7d";

export const ACCESS_TOKEN_MAX_AGE_SECONDS = 15 * 60;
export const REFRESH_TOKEN_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

export const BCRYPT_COST = 12;

export const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
] as const;

export const AUTH_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
] as const;

/** Password reset tokens expire after 30 minutes. */
export const PASSWORD_RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

export const PROTECTED_ROUTE_PREFIXES = [
  "/dashboard",
  "/tasks",
  "/subjects",
  "/calendar",
  "/analytics",
  "/settings",
  "/admin",
] as const;

export const ADMIN_API_PREFIX = "/api/admin" as const;

export const PUBLIC_API_ROUTES = [
  "/api/auth/register",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/refresh",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/cron/task-notifications",
] as const;

export type SafeUser = {
  id: string;
  email: string;
  name: string | null;
  profilePhotoUrl: string | null;
  course: string | null;
  college: string | null;
  semester: string | null;
  academicYear: string | null;
  emailDeadlineReminders: boolean;
  emailOverdueNotifications: boolean;
  createdAt: Date;
  updatedAt: Date;
  isAdmin: boolean;
};

export type TokenPayload = {
  sub: string;
  email: string;
  tokenVersion: number;
};
