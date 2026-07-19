import { NextResponse } from "next/server";

import { AppError, apiSuccess, handleApiError } from "@/lib/api-response";
import { checkRateLimit, getClientIp } from "@/lib/auth/rate-limit";
import { hashPassword } from "@/lib/auth/password";
import { setAuthCookies, toSafeUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validators/auth";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(`register:${ip}`, 3, 60 * 60 * 1000);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: {
            code: "RATE_LIMITED",
            message: "Too many registration attempts. Please try again later.",
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
    const data = registerSchema.parse(body);
    const email = data.email.toLowerCase();

    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AppError("EMAIL_IN_USE", "An account with this email already exists", 409);
    }

    const passwordHash = await hashPassword(data.password);

    const user = await db.user.create({
      data: {
        email,
        passwordHash,
        name: data.name?.trim() || null,
      },
    });

    const safeUser = toSafeUser(user);
    const response = apiSuccess({ user: safeUser }, 201);

    setAuthCookies(response, {
      sub: user.id,
      email: user.email,
    });

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
