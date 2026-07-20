import { NextRequest, NextResponse } from "next/server";

import { checkRateLimit, getClientIp } from "@/lib/auth/rate-limit";
import {
  OAUTH_STATE_COOKIE,
  exchangeGoogleAuthorizationCode,
  parseAndValidateOAuthState,
  upsertUserFromGoogleIdentity,
  verifyGoogleIdToken,
} from "@/lib/auth/google-oauth";
import { setAuthCookies } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clearOAuthState(response: NextResponse) {
  response.cookies.set(OAUTH_STATE_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

function loginErrorRedirect(request: NextRequest, code: string) {
  const response = NextResponse.redirect(new URL(`/login?error=${code}`, request.url));
  clearOAuthState(response);
  return response;
}

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`google-oauth-callback:${ip}`, 30, 15 * 60 * 1000);

  if (!rateLimit.allowed) {
    return loginErrorRedirect(request, "rate_limited");
  }

  const url = request.nextUrl;
  const error = url.searchParams.get("error");
  if (error) {
    return loginErrorRedirect(request, "google_denied");
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const stateCookie = request.cookies.get(OAUTH_STATE_COOKIE)?.value ?? null;

  let redirectTo = "/dashboard";
  try {
    const parsed = parseAndValidateOAuthState(state, stateCookie);
    redirectTo = parsed.redirectTo;
  } catch {
    return loginErrorRedirect(request, "google_state");
  }

  if (!code) {
    return loginErrorRedirect(request, "google_code");
  }

  try {
    const idToken = await exchangeGoogleAuthorizationCode(code);
    const identity = await verifyGoogleIdToken(idToken);
    const user = await upsertUserFromGoogleIdentity(identity);

    const response = NextResponse.redirect(new URL(redirectTo, request.url));
    clearOAuthState(response);
    setAuthCookies(response, {
      sub: user.id,
      email: user.email,
      tokenVersion: user.tokenVersion,
    });
    return response;
  } catch {
    return loginErrorRedirect(request, "google_failed");
  }
}
