import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

import {
  ACCESS_TOKEN_MAX_AGE_SECONDS,
  AUTH_COOKIE_ACCESS,
  AUTH_COOKIE_REFRESH,
  REFRESH_TOKEN_MAX_AGE_SECONDS,
  type SafeUser,
  type TokenPayload,
} from "@/lib/auth/constants";
import { withAdminFlag } from "@/lib/auth/admin";
import { signAccessToken, signRefreshToken, verifyAccessToken } from "@/lib/auth/jwt";
import { db } from "@/lib/db";

const cookieBaseOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
};

export function toSafeUser(user: {
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
}): SafeUser {
  return withAdminFlag({
    id: user.id,
    email: user.email,
    name: user.name,
    profilePhotoUrl: user.profilePhotoUrl,
    course: user.course,
    college: user.college,
    semester: user.semester,
    academicYear: user.academicYear,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  });
}

export function setAuthCookies(response: NextResponse, payload: TokenPayload): void {
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  response.cookies.set(AUTH_COOKIE_ACCESS, accessToken, {
    ...cookieBaseOptions,
    maxAge: ACCESS_TOKEN_MAX_AGE_SECONDS,
  });

  response.cookies.set(AUTH_COOKIE_REFRESH, refreshToken, {
    ...cookieBaseOptions,
    maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
  });
}

export async function setAuthCookiesOnStore(payload: TokenPayload): Promise<void> {
  const cookieStore = await cookies();
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  cookieStore.set(AUTH_COOKIE_ACCESS, accessToken, {
    ...cookieBaseOptions,
    maxAge: ACCESS_TOKEN_MAX_AGE_SECONDS,
  });

  cookieStore.set(AUTH_COOKIE_REFRESH, refreshToken, {
    ...cookieBaseOptions,
    maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
  });
}

export function clearAuthCookies(response: NextResponse): void {
  response.cookies.set(AUTH_COOKIE_ACCESS, "", {
    ...cookieBaseOptions,
    maxAge: 0,
  });

  response.cookies.set(AUTH_COOKIE_REFRESH, "", {
    ...cookieBaseOptions,
    maxAge: 0,
  });
}

export async function clearAuthCookiesOnStore(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(AUTH_COOKIE_ACCESS, "", {
    ...cookieBaseOptions,
    maxAge: 0,
  });

  cookieStore.set(AUTH_COOKIE_REFRESH, "", {
    ...cookieBaseOptions,
    maxAge: 0,
  });
}

export async function getCurrentUser(): Promise<SafeUser | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(AUTH_COOKIE_ACCESS)?.value;

  if (!accessToken) {
    return null;
  }

  try {
    const payload = verifyAccessToken(accessToken);
    const user = await db.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        profilePhotoUrl: true,
        course: true,
        college: true,
        semester: true,
        academicYear: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user ? toSafeUser(user) : null;
  } catch {
    return null;
  }
}

export async function requireCurrentUser(): Promise<SafeUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  return user;
}
