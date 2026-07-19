import { jwtVerify } from "jose";

import { AUTH_COOKIE_ACCESS, type TokenPayload } from "@/lib/auth/constants";

function getJwtSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }

  return new TextEncoder().encode(secret);
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

export function getAccessTokenFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie");

  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";").map((part) => part.trim());

  for (const cookie of cookies) {
    const [name, ...valueParts] = cookie.split("=");
    if (name === AUTH_COOKIE_ACCESS) {
      return decodeURIComponent(valueParts.join("="));
    }
  }

  return null;
}
