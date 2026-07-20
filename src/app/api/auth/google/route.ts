import { NextResponse } from "next/server";

import { checkRateLimit, getClientIp } from "@/lib/auth/rate-limit";
import {
  OAUTH_STATE_COOKIE,
  OAUTH_STATE_MAX_AGE_SECONDS,
  buildGoogleAuthorizationUrl,
  createOAuthStatePayload,
  isGoogleOAuthConfigured,
} from "@/lib/auth/google-oauth";
import { getSafeRedirectPath } from "@/lib/auth/safe-redirect";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`google-oauth:${ip}`, 20, 15 * 60 * 1000);

  if (!rateLimit.allowed) {
    return NextResponse.redirect(new URL("/login?error=rate_limited", request.url));
  }

  if (!isGoogleOAuthConfigured()) {
    return NextResponse.redirect(new URL("/login?error=google_unavailable", request.url));
  }

  const requestUrl = new URL(request.url);
  const redirectTo = getSafeRedirectPath(requestUrl.searchParams.get("redirect"));
  const { state } = createOAuthStatePayload(redirectTo);

  let authorizationUrl: string;
  try {
    authorizationUrl = buildGoogleAuthorizationUrl(state);
  } catch {
    return NextResponse.redirect(new URL("/login?error=google_unavailable", request.url));
  }

  const response = NextResponse.redirect(authorizationUrl);
  response.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: OAUTH_STATE_MAX_AGE_SECONDS,
  });

  return response;
}
