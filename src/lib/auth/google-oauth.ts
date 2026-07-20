import { randomBytes } from "crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { Prisma } from "@/generated/prisma/client";

import { getSafeRedirectPath } from "@/lib/auth/safe-redirect";
import { db } from "@/lib/db";

export const GOOGLE_OAUTH_PROVIDER = "google";
export const OAUTH_STATE_COOKIE = "taskzen_oauth_state";
export const OAUTH_STATE_MAX_AGE_SECONDS = 10 * 60;

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export type GoogleIdTokenClaims = {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
};

function readEnv(name: string): string | undefined {
  const raw = process.env[name];
  if (raw == null) return undefined;
  let value = raw.trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1).trim();
  }
  return value || undefined;
}

export function getGoogleOAuthConfig() {
  const clientId = readEnv("GOOGLE_CLIENT_ID");
  const clientSecret = readEnv("GOOGLE_CLIENT_SECRET");
  const appUrl = (readEnv("NEXT_PUBLIC_APP_URL") || "http://localhost:3000").replace(/\/$/, "");
  const redirectUri = `${appUrl}/api/auth/google/callback`;

  return { clientId, clientSecret, appUrl, redirectUri };
}

export function isGoogleOAuthConfigured(): boolean {
  const { clientId, clientSecret } = getGoogleOAuthConfig();
  return Boolean(clientId && clientSecret);
}

export function createOAuthStatePayload(redirectTo: string): { state: string; nonce: string } {
  const nonce = randomBytes(24).toString("base64url");
  const redirect = getSafeRedirectPath(redirectTo);
  const state = Buffer.from(
    JSON.stringify({
      n: nonce,
      r: redirect,
      t: Date.now(),
    }),
    "utf8",
  ).toString("base64url");

  return { state, nonce };
}

export function parseAndValidateOAuthState(
  stateFromQuery: string | null,
  stateFromCookie: string | null,
): { redirectTo: string } {
  if (!stateFromQuery || !stateFromCookie || stateFromQuery !== stateFromCookie) {
    throw new Error("INVALID_OAUTH_STATE");
  }

  let parsed: { n?: string; r?: string; t?: number };
  try {
    parsed = JSON.parse(Buffer.from(stateFromQuery, "base64url").toString("utf8")) as {
      n?: string;
      r?: string;
      t?: number;
    };
  } catch {
    throw new Error("INVALID_OAUTH_STATE");
  }

  if (!parsed.n || typeof parsed.t !== "number") {
    throw new Error("INVALID_OAUTH_STATE");
  }

  if (Date.now() - parsed.t > OAUTH_STATE_MAX_AGE_SECONDS * 1000) {
    throw new Error("EXPIRED_OAUTH_STATE");
  }

  return { redirectTo: getSafeRedirectPath(parsed.r) };
}

export function buildGoogleAuthorizationUrl(state: string): string {
  const { clientId, redirectUri } = getGoogleOAuthConfig();
  if (!clientId) {
    throw new Error("GOOGLE_OAUTH_NOT_CONFIGURED");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeGoogleAuthorizationCode(code: string): Promise<string> {
  const { clientId, clientSecret, redirectUri } = getGoogleOAuthConfig();
  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_OAUTH_NOT_CONFIGURED");
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    throw new Error("GOOGLE_TOKEN_EXCHANGE_FAILED");
  }

  const payload = (await response.json()) as { id_token?: string };
  if (!payload.id_token) {
    throw new Error("GOOGLE_ID_TOKEN_MISSING");
  }

  return payload.id_token;
}

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleIdTokenClaims> {
  const { clientId } = getGoogleOAuthConfig();
  if (!clientId) {
    throw new Error("GOOGLE_OAUTH_NOT_CONFIGURED");
  }

  const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    audience: clientId,
  });

  const sub = payload.sub;
  const email = typeof payload.email === "string" ? payload.email.toLowerCase().trim() : "";
  const emailVerified = payload.email_verified === true || payload.email_verified === "true";

  if (!sub || !email || !emailVerified) {
    throw new Error("GOOGLE_EMAIL_NOT_VERIFIED");
  }

  return {
    sub,
    email,
    email_verified: true,
    name: typeof payload.name === "string" ? payload.name.slice(0, 100) : undefined,
    picture: typeof payload.picture === "string" ? payload.picture : undefined,
  };
}

function isSafeHttpUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    return url.toString().slice(0, 2048);
  } catch {
    return null;
  }
}

/**
 * Resolve or create a Taskzen user from a verified Google identity.
 * Does not store Google access/refresh tokens.
 */
export async function upsertUserFromGoogleIdentity(identity: GoogleIdTokenClaims) {
  const existingOauth = await db.oAuthAccount.findUnique({
    where: {
      provider_providerAccountId: {
        provider: GOOGLE_OAUTH_PROVIDER,
        providerAccountId: identity.sub,
      },
    },
    include: { user: true },
  });

  if (existingOauth) {
    return existingOauth.user;
  }

  const existingEmailUser = await db.user.findUnique({
    where: { email: identity.email },
  });

  if (existingEmailUser) {
    try {
      await db.oAuthAccount.create({
        data: {
          userId: existingEmailUser.id,
          provider: GOOGLE_OAUTH_PROVIDER,
          providerAccountId: identity.sub,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const raced = await db.oAuthAccount.findUnique({
          where: {
            provider_providerAccountId: {
              provider: GOOGLE_OAUTH_PROVIDER,
              providerAccountId: identity.sub,
            },
          },
          include: { user: true },
        });
        if (raced) {
          return raced.user;
        }
      }
      throw error;
    }
    // Do not overwrite existing profile fields when linking.
    return existingEmailUser;
  }

  const picture = isSafeHttpUrl(identity.picture);

  try {
    return await db.user.create({
      data: {
        email: identity.email,
        passwordHash: null,
        name: identity.name?.trim() || null,
        profilePhotoUrl: picture,
        oauthAccounts: {
          create: {
            provider: GOOGLE_OAUTH_PROVIDER,
            providerAccountId: identity.sub,
          },
        },
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const racedOauth = await db.oAuthAccount.findUnique({
        where: {
          provider_providerAccountId: {
            provider: GOOGLE_OAUTH_PROVIDER,
            providerAccountId: identity.sub,
          },
        },
        include: { user: true },
      });
      if (racedOauth) {
        return racedOauth.user;
      }

      const racedEmail = await db.user.findUnique({
        where: { email: identity.email },
      });
      if (racedEmail) {
        return upsertUserFromGoogleIdentity(identity);
      }
    }
    throw error;
  }
}
