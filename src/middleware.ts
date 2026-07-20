import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  ACCESS_TOKEN_MAX_AGE_SECONDS,
  AUTH_COOKIE_ACCESS,
  AUTH_ROUTES,
  ADMIN_API_PREFIX,
  PROTECTED_ROUTE_PREFIXES,
  PUBLIC_API_ROUTES,
} from "@/lib/auth/constants";
import { isAdminEmail } from "@/lib/auth/admin-config";
import {
  getAccessTokenFromRequest,
  getRefreshTokenFromRequest,
  signAccessTokenEdge,
  verifyAccessTokenEdge,
  verifyRefreshTokenEdge,
} from "@/lib/auth/jwt-edge";

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => pathname === route);
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTE_PREFIXES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function isAdminRoute(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function isAdminApiRoute(pathname: string): boolean {
  return pathname.startsWith(ADMIN_API_PREFIX);
}

function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_ROUTES.includes(pathname as (typeof PUBLIC_API_ROUTES)[number]);
}

function isProtectedApiRoute(pathname: string): boolean {
  return pathname.startsWith("/api/") && !isPublicApiRoute(pathname);
}

const cookieBaseOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = getAccessTokenFromRequest(request);
  let session = accessToken ? await verifyAccessTokenEdge(accessToken) : null;
  let refreshedAccessToken: string | null = null;

  if (!session) {
    const refreshToken = getRefreshTokenFromRequest(request);
    const refreshSession = refreshToken ? await verifyRefreshTokenEdge(refreshToken) : null;

    if (refreshSession) {
      session = refreshSession;
      refreshedAccessToken = await signAccessTokenEdge(refreshSession);
    }
  }

  const isAuthenticated = Boolean(session);

  function withRefreshedAccess(response: NextResponse) {
    if (refreshedAccessToken) {
      response.cookies.set(AUTH_COOKIE_ACCESS, refreshedAccessToken, {
        ...cookieBaseOptions,
        maxAge: ACCESS_TOKEN_MAX_AGE_SECONDS,
      });
    }

    return response;
  }

  if (isProtectedRoute(pathname) && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    const response = NextResponse.redirect(loginUrl);
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return response;
  }

  if (isAuthRoute(pathname) && isAuthenticated) {
    return withRefreshedAccess(NextResponse.redirect(new URL("/dashboard", request.url)));
  }

  if (isProtectedApiRoute(pathname) && !isAuthenticated) {
    return NextResponse.json(
      {
        error: {
          code: "UNAUTHORIZED",
          message: "Your session has expired. Please sign in again.",
        },
      },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      },
    );
  }

  if ((isAdminRoute(pathname) || isAdminApiRoute(pathname)) && isAuthenticated) {
    const isAdmin = session ? isAdminEmail(session.email) : false;

    if (!isAdmin) {
      if (isAdminApiRoute(pathname)) {
        return NextResponse.json(
          {
            error: {
              code: "FORBIDDEN",
              message: "You do not have permission to access this resource.",
            },
          },
          {
            status: 403,
            headers: {
              "Cache-Control": "no-store, no-cache, must-revalidate",
            },
          },
        );
      }

      return withRefreshedAccess(NextResponse.redirect(new URL("/dashboard", request.url)));
    }
  }

  const response = NextResponse.next();

  if (isProtectedRoute(pathname)) {
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  }

  return withRefreshedAccess(response);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
