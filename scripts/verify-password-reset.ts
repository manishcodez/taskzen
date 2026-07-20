/**
 * Password-reset verification (service-layer).
 * TASKZEN_ALLOW_DB_TESTS=1 EMAIL_PROVIDER=memory npx tsx scripts/verify-password-reset.ts
 */

import "dotenv/config";
import { config } from "dotenv";

config({ path: ".env.local", override: true });

process.env.EMAIL_PROVIDER = "memory";

import { assertDbTestsAllowed } from "./lib/db-test-guard";
import { clearCapturedEmails, getLastCapturedEmail } from "../src/lib/email/provider";
import { hashPassword, verifyPassword } from "../src/lib/auth/password";
import { db } from "../src/lib/db";
import {
  FORGOT_PASSWORD_GENERIC_MESSAGE,
  hashPasswordResetToken,
  requestPasswordReset,
  resetPasswordWithToken,
} from "../src/services/password-reset.service";

function extractToken(resetUrl: string): string {
  const url = new URL(resetUrl);
  const token = url.searchParams.get("token");
  if (!token) {
    throw new Error("Reset URL missing token");
  }
  return token;
}

async function main() {
  assertDbTestsAllowed("verify-password-reset");

  const suffix = Date.now();
  const email = `reset-${suffix}@example.com`;
  const oldPassword = "old-password-12345";
  const newPassword = "new-password-67890";
  let userId: string | null = null;

  try {
    const passwordHash = await hashPassword(oldPassword);
    const user = await db.user.create({
      data: {
        email,
        passwordHash,
        name: "Reset Tester",
      },
    });
    userId = user.id;

    clearCapturedEmails();

    const unknownMessage = await requestPasswordReset(`missing-${suffix}@example.com`);
    if (unknownMessage !== FORGOT_PASSWORD_GENERIC_MESSAGE) {
      throw new Error("Unknown email did not return generic message");
    }
    if (getLastCapturedEmail()) {
      throw new Error("Unknown email should not send mail");
    }
    console.log("PASS unknown email generic response");

    const knownMessage = await requestPasswordReset(email);
    if (knownMessage !== FORGOT_PASSWORD_GENERIC_MESSAGE) {
      throw new Error("Known email did not return generic message");
    }

    const captured = getLastCapturedEmail();
    if (!captured?.text.includes("reset")) {
      throw new Error("Expected password reset email to be captured");
    }

    const token = extractToken(
      captured.text
        .split("\n")
        .map((line) => line.trim())
        .find((line) => line.includes("/reset-password?token=")) || "",
    );

    const tokenHash = hashPasswordResetToken(token);
    const stored = await db.passwordResetToken.findUnique({ where: { tokenHash } });
    if (!stored || stored.tokenHash === token) {
      throw new Error("Raw token must not equal stored hash");
    }
    console.log("PASS reset email + hashed token stored");

    clearCapturedEmails();
    await requestPasswordReset(email);
    const second = getLastCapturedEmail();
    if (!second) {
      throw new Error("Second reset request should send a new email");
    }
    const secondToken = extractToken(
      second.text
        .split("\n")
        .map((line) => line.trim())
        .find((line) => line.includes("/reset-password?token=")) || "",
    );

    const firstReuse = await resetPasswordWithToken(token, newPassword);
    if (firstReuse.ok) {
      throw new Error("Older token should be invalidated by newer request");
    }
    console.log("PASS older token invalidated");

    const invalid = await resetPasswordWithToken("not-a-real-token", newPassword);
    if (invalid.ok) {
      throw new Error("Invalid token should fail");
    }
    console.log("PASS invalid token rejected");

    const expiredId = await db.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashPasswordResetToken(`expired-${suffix}`),
        expiresAt: new Date(Date.now() - 60_000),
      },
    });
    const expired = await resetPasswordWithToken(`expired-${suffix}`, newPassword);
    if (expired.ok) {
      throw new Error("Expired token should fail");
    }
    await db.passwordResetToken.delete({ where: { id: expiredId.id } });
    console.log("PASS expired token rejected");

    const success = await resetPasswordWithToken(secondToken, newPassword);
    if (!success.ok) {
      throw new Error("Valid token should reset password");
    }

    const updated = await db.user.findUnique({ where: { id: user.id } });
    if (!updated) {
      throw new Error("User missing after reset");
    }
    if (!(await verifyPassword(newPassword, updated.passwordHash))) {
      throw new Error("New password should verify");
    }
    if (await verifyPassword(oldPassword, updated.passwordHash)) {
      throw new Error("Old password should no longer verify");
    }
    if (updated.tokenVersion !== 1) {
      throw new Error(`Expected tokenVersion 1, got ${updated.tokenVersion}`);
    }
    console.log("PASS password updated + tokenVersion bumped");

    const reused = await resetPasswordWithToken(secondToken, "another-password-999");
    if (reused.ok) {
      throw new Error("Used token must not be reusable");
    }
    console.log("PASS used token rejected");

    console.log("verify-password-reset: ALL CHECKS PASSED");
  } finally {
    if (userId) {
      await db.user.delete({ where: { id: userId } }).catch(() => undefined);
    }
    await db.$disconnect();
  }
}

main().catch(async (error) => {
  console.error(error);
  await db.$disconnect();
  process.exit(1);
});
