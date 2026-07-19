import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  AUTH_ROUTES,
  PROTECTED_ROUTE_PREFIXES,
  PUBLIC_API_ROUTES,
} from "@/lib/auth/constants";
import { getAccessTokenFromRequest, verifyAccessTokenEdge } from "@/lib/auth/jwt-edge";

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => pathname === route);
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTE_PREFIXES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_ROUTES.includes(pathname as (typeof PUBLIC_API_ROUTES)[number]);
}

function isProtectedApiRoute(pathname: string): boolean {
  return pathname.startsWith("/api/") && !isPublicApiRoute(pathname);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = getAccessTokenFromRequest(request);
  const session = accessToken ? await verifyAccessTokenEdge(accessToken) : null;
  const isAuthenticated = Boolean(session);

  if (isProtectedRoute(pathname) && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    const response = NextResponse.redirect(loginUrl);
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return response;
  }

  if (isAuthRoute(pathname) && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
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

  const response = NextResponse.next();

  if (isProtectedRoute(pathname)) {
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
