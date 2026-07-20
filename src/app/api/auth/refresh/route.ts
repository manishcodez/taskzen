import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { apiSuccess, handleApiError } from "@/lib/api-response";
import { AUTH_COOKIE_REFRESH } from "@/lib/auth/constants";
import { verifyRefreshToken } from "@/lib/auth/jwt";
import { clearAuthCookies, setAuthCookies, toSafeUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get(AUTH_COOKIE_REFRESH)?.value;

    if (!refreshToken) {
      const response = NextResponse.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Your session has expired. Please sign in again.",
          },
        },
        { status: 401 },
      );
      clearAuthCookies(response);
      return response;
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      const response = NextResponse.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Your session has expired. Please sign in again.",
          },
        },
        { status: 401 },
      );
      clearAuthCookies(response);
      return response;
    }

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
        tokenVersion: true,
      },
    });

    if (
      !user ||
      user.email.toLowerCase() !== payload.email.toLowerCase() ||
      user.tokenVersion !== payload.tokenVersion
    ) {
      const response = NextResponse.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Your session has expired. Please sign in again.",
          },
        },
        { status: 401 },
      );
      clearAuthCookies(response);
      return response;
    }

    const response = apiSuccess({ user: toSafeUser(user) });
    setAuthCookies(response, {
      sub: user.id,
      email: user.email,
      tokenVersion: user.tokenVersion,
    });
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
