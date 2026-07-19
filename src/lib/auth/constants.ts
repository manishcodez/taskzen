export const AUTH_COOKIE_ACCESS = "taskzen_access_token";
export const AUTH_COOKIE_REFRESH = "taskzen_refresh_token";

export const ACCESS_TOKEN_EXPIRES_IN = "15m";
export const REFRESH_TOKEN_EXPIRES_IN = "7d";

export const ACCESS_TOKEN_MAX_AGE_SECONDS = 15 * 60;
export const REFRESH_TOKEN_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

export const BCRYPT_COST = 12;

export const PUBLIC_ROUTES = ["/", "/login", "/register"] as const;

export const AUTH_ROUTES = ["/login", "/register"] as const;

export const PROTECTED_ROUTE_PREFIXES = [
  "/dashboard",
  "/tasks",
  "/subjects",
  "/calendar",
  "/analytics",
  "/settings",
] as const;

export const PUBLIC_API_ROUTES = [
  "/api/auth/register",
  "/api/auth/login",
  "/api/auth/logout",
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
  createdAt: Date;
  updatedAt: Date;
};

export type TokenPayload = {
  sub: string;
  email: string;
};
