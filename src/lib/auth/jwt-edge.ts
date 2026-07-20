import { SignJWT, jwtVerify } from "jose";

import {
  ACCESS_TOKEN_EXPIRES_IN,
  AUTH_COOKIE_ACCESS,
  AUTH_COOKIE_REFRESH,
  type TokenPayload,
} from "@/lib/auth/constants";

function getJwtSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }

  return new TextEncoder().encode(secret);
}

function getJwtRefreshSecretKey(): Uint8Array {
  const secret = process.env.JWT_REFRESH_SECRET;

  if (!secret) {
    throw new Error("JWT_REFRESH_SECRET is not set");
  }

  return new TextEncoder().encode(secret);
}

function readCookie(request: Request, cookieName: string): string | null {
  const cookieHeader = request.headers.get("cookie");

  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";").map((part) => part.trim());

  for (const cookie of cookies) {
    const [name, ...valueParts] = cookie.split("=");
    if (name === cookieName) {
      return decodeURIComponent(valueParts.join("="));
    }
  }

  return null;
}

export async function verifyAccessTokenEdge(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey());
    const sub = payload.sub;
    const email = payload.email;

    if (typeof sub !== "string" || typeof email !== "string") {
      return null;
    }

    return { sub, email };
  } catch {
    return null;
  }
}

export async function verifyRefreshTokenEdge(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtRefreshSecretKey());
    const sub = payload.sub;
    const email = payload.email;

    if (typeof sub !== "string" || typeof email !== "string") {
      return null;
    }

    return { sub, email };
  } catch {
    return null;
  }
}

export async function signAccessTokenEdge(payload: TokenPayload): Promise<string> {
  return new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRES_IN)
    .sign(getJwtSecretKey());
}

export function getAccessTokenFromRequest(request: Request): string | null {
  return readCookie(request, AUTH_COOKIE_ACCESS);
}

export function getRefreshTokenFromRequest(request: Request): string | null {
  return readCookie(request, AUTH_COOKIE_REFRESH);
}
