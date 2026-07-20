import { NextResponse } from "next/server";

import { AppError, apiSuccess, handleApiError } from "@/lib/api-response";
import { checkRateLimit, getClientIp } from "@/lib/auth/rate-limit";
import { verifyPassword } from "@/lib/auth/password";
import { setAuthCookies, toSafeUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { loginSchema } from "@/lib/validators/auth";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(`login:${ip}`, 5, 15 * 60 * 1000);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: {
            code: "RATE_LIMITED",
            message: "Too many login attempts. Please try again later.",
          },
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds),
          },
        },
      );
    }

    const body = await request.json();
    const data = loginSchema.parse(body);

    const user = await db.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (!user?.passwordHash) {
      throw new AppError("INVALID_CREDENTIALS", "Invalid email or password", 401);
    }

    const isValidPassword = await verifyPassword(data.password, user.passwordHash);

    if (!isValidPassword) {
      throw new AppError("INVALID_CREDENTIALS", "Invalid email or password", 401);
    }

    const safeUser = toSafeUser(user);
    const response = apiSuccess({ user: safeUser });

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
