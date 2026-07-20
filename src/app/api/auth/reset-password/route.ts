import { NextResponse } from "next/server";

import { AppError, apiSuccess, handleApiError } from "@/lib/api-response";
import { checkRateLimit, getClientIp } from "@/lib/auth/rate-limit";
import { clearAuthCookies } from "@/lib/auth/session";
import { resetPasswordSchema } from "@/lib/validators/auth";
import { resetPasswordWithToken } from "@/services/password-reset.service";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(`reset-password:${ip}`, 8, 15 * 60 * 1000);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: {
            code: "RATE_LIMITED",
            message: "Too many password reset attempts. Please try again later.",
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
    const data = resetPasswordSchema.parse(body);
    const result = await resetPasswordWithToken(data.token, data.newPassword);

    if (!result.ok) {
      throw new AppError(
        "INVALID_TOKEN",
        "This reset link is invalid or has expired. Request a new one.",
        400,
      );
    }

    const response = apiSuccess({
      message: "Your password has been updated. You can sign in with your new password.",
    });
    clearAuthCookies(response);
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
