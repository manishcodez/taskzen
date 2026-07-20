import jwt from "jsonwebtoken";

import {
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
  type TokenPayload,
} from "@/lib/auth/constants";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }

  return secret;
}

function getJwtRefreshSecret(): string {
  const secret = process.env.JWT_REFRESH_SECRET;

  if (!secret) {
    throw new Error("JWT_REFRESH_SECRET is not set");
  }

  return secret;
}

function toTokenPayload(decoded: string | jwt.JwtPayload): TokenPayload {
  if (!decoded || typeof decoded === "string") {
    throw new Error("Invalid token payload");
  }

  const sub = decoded.sub;
  const email = decoded.email;
  const tokenVersion = decoded.tokenVersion;

  if (typeof sub !== "string" || typeof email !== "string") {
    throw new Error("Invalid token payload");
  }

  const version =
    typeof tokenVersion === "number" && Number.isFinite(tokenVersion)
      ? tokenVersion
      : typeof tokenVersion === "string" && /^\d+$/.test(tokenVersion)
        ? Number(tokenVersion)
        : 0;

  return { sub, email, tokenVersion: version };
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(
    { email: payload.email, tokenVersion: payload.tokenVersion },
    getJwtSecret(),
    {
      subject: payload.sub,
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    },
  );
}

export function signRefreshToken(payload: TokenPayload): string {
  return jwt.sign(
    { email: payload.email, tokenVersion: payload.tokenVersion },
    getJwtRefreshSecret(),
    {
      subject: payload.sub,
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    },
  );
}

export function verifyAccessToken(token: string): TokenPayload {
  return toTokenPayload(jwt.verify(token, getJwtSecret()));
}

export function verifyRefreshToken(token: string): TokenPayload {
  return toTokenPayload(jwt.verify(token, getJwtRefreshSecret()));
}
