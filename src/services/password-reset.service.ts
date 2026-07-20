import { createHash, randomBytes } from "crypto";

import { PASSWORD_RESET_TOKEN_TTL_MS } from "@/lib/auth/constants";
import { hashPassword } from "@/lib/auth/password";
import { sendPasswordResetEmail } from "@/lib/email/send-password-reset";
import { db } from "@/lib/db";

export const FORGOT_PASSWORD_GENERIC_MESSAGE =
  "If an account exists for this email, a password reset link has been sent.";

export function hashPasswordResetToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

export function createRawPasswordResetToken(): string {
  return randomBytes(32).toString("base64url");
}

function getAppBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }

  return "http://localhost:3000";
}

/**
 * Always returns the same generic message. Does not reveal whether the email exists.
 * Never logs the raw token or password.
 */
export async function requestPasswordReset(emailInput: string): Promise<string> {
  const email = emailInput.trim().toLowerCase();

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true },
  });

  if (!user) {
    return FORGOT_PASSWORD_GENERIC_MESSAGE;
  }

  const rawToken = createRawPasswordResetToken();
  const tokenHash = hashPasswordResetToken(rawToken);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS);

  await db.$transaction([
    db.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    }),
    db.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    }),
  ]);

  const resetUrl = `${getAppBaseUrl()}/reset-password?token=${encodeURIComponent(rawToken)}`;

  try {
    await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl,
      expiresInMinutes: Math.round(PASSWORD_RESET_TOKEN_TTL_MS / 60000),
    });
  } catch (error) {
    console.error("Failed to send password reset email.");
    if (process.env.NODE_ENV !== "production") {
      console.error(error instanceof Error ? error.message : "Unknown email error");
    }
  }

  return FORGOT_PASSWORD_GENERIC_MESSAGE;
}

export async function resetPasswordWithToken(rawToken: string, newPassword: string) {
  const tokenHash = hashPasswordResetToken(rawToken);

  const record = await db.passwordResetToken.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
      usedAt: true,
      user: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  });

  if (!record || record.usedAt || record.expiresAt.getTime() <= Date.now()) {
    return { ok: false as const, code: "INVALID_TOKEN" as const };
  }

  const passwordHash = await hashPassword(newPassword);

  await db.$transaction([
    db.user.update({
      where: { id: record.userId },
      data: {
        passwordHash,
        tokenVersion: { increment: 1 },
      },
    }),
    db.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    db.passwordResetToken.updateMany({
      where: {
        userId: record.userId,
        usedAt: null,
        id: { not: record.id },
      },
      data: { usedAt: new Date() },
    }),
  ]);

  return { ok: true as const };
}
