import { NextResponse } from "next/server";
import { ZodError } from "zod";

import type { ApiErrorResponse } from "@/types";

export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly fields?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function apiSuccess<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function apiError(
  code: string,
  message: string,
  status: number,
  fields?: Record<string, string[]>,
): NextResponse {
  const body: ApiErrorResponse = {
    error: {
      code,
      message,
      ...(fields ? { fields } : {}),
    },
  };

  return NextResponse.json(body, { status });
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return apiError(error.code, error.message, error.status, error.fields);
  }

  if (error instanceof ZodError) {
    return apiError(
      "VALIDATION_ERROR",
      "Invalid request data",
      400,
      formatZodFieldErrors(error),
    );
  }

  console.error(error);

  return apiError("INTERNAL_ERROR", "Something went wrong. Please try again.", 500);
}

export function formatZodFieldErrors(error: ZodError): Record<string, string[]> {
  const flattened = error.flatten().fieldErrors;
  const fields: Record<string, string[]> = {};

  for (const [key, value] of Object.entries(flattened)) {
    if (Array.isArray(value)) {
      fields[key] = value;
    }
  }

  return fields;
}
