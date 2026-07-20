import { NextResponse } from "next/server";

import { apiSuccess, handleApiError } from "@/lib/api-response";
import { checkRateLimit, getClientIp } from "@/lib/auth/rate-limit";
import { forgotPasswordSchema } from "@/lib/validators/auth";
import { requestPasswordReset } from "@/services/password-reset.service";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(`forgot-password:${ip}`, 5, 15 * 60 * 1000);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: {
            code: "RATE_LIMITED",
            message: "Too many password reset requests. Please try again later.",
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
    const data = forgotPasswordSchema.parse(body);
    const message = await requestPasswordReset(data.email);

    return apiSuccess({ message });
  } catch (error) {
    return handleApiError(error);
  }
}
