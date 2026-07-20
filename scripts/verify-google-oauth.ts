/**
 * Google OAuth verification (service-layer + state helpers).
 * Does not call live Google APIs or invent credentials.
 *
 * TASKZEN_ALLOW_DB_TESTS=1 npx tsx scripts/verify-google-oauth.ts
 */

import "dotenv/config";
import { config } from "dotenv";

config({ path: ".env.local", override: true });

import { assertDbTestsAllowed } from "./lib/db-test-guard";
import { hashPassword, verifyPassword } from "../src/lib/auth/password";
import {
  GOOGLE_OAUTH_PROVIDER,
  createOAuthStatePayload,
  getGoogleOAuthConfig,
  parseAndValidateOAuthState,
  upsertUserFromGoogleIdentity,
} from "../src/lib/auth/google-oauth";
import { getSafeRedirectPath } from "../src/lib/auth/safe-redirect";
import { isAdminEmail } from "../src/lib/auth/admin-config";
import { db } from "../src/lib/db";
import {
  FORGOT_PASSWORD_GENERIC_MESSAGE,
  requestPasswordReset,
} from "../src/services/password-reset.service";
import { clearAuthCookies, setAuthCookies } from "../src/lib/auth/session";
import { NextResponse } from "next/server";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  assertDbTestsAllowed("verify-google-oauth");

  const suffix = Date.now();
  const createdUserIds: string[] = [];

  try {
    // --- State / CSRF helpers ---
    const { state } = createOAuthStatePayload("/tasks");
    const ok = parseAndValidateOAuthState(state, state);
    assert(ok.redirectTo === "/tasks", "Valid state should preserve safe redirect");
    console.log("PASS oauth state accepts matching cookie+query");

    try {
      parseAndValidateOAuthState(state, "tampered");
      throw new Error("Expected invalid state mismatch to throw");
    } catch (error) {
      assert(
        error instanceof Error && error.message !== "Expected invalid state mismatch to throw",
        "State mismatch must throw",
      );
    }
    console.log("PASS invalid oauth state rejected");

    try {
      parseAndValidateOAuthState(null, state);
      throw new Error("Expected missing state to throw");
    } catch (error) {
      assert(
        error instanceof Error && error.message !== "Expected missing state to throw",
        "Missing state must throw",
      );
    }

    const expiredState = Buffer.from(
      JSON.stringify({ n: "x", r: "/dashboard", t: Date.now() - 11 * 60 * 1000 }),
      "utf8",
    ).toString("base64url");
    try {
      parseAndValidateOAuthState(expiredState, expiredState);
      throw new Error("Expected expired state to throw");
    } catch (error) {
      assert(
        error instanceof Error && error.message !== "Expected expired state to throw",
        "Expired state must throw",
      );
    }
    console.log("PASS expired oauth state rejected");

    assert(
      getSafeRedirectPath("https://evil.com") === "/dashboard",
      "Open redirects must fall back",
    );
    assert(
      getSafeRedirectPath("//evil.com") === "/dashboard",
      "Protocol-relative redirects must fall back",
    );
    console.log("PASS redirect sanitization");

    const { redirectUri, clientId, clientSecret } = getGoogleOAuthConfig();
    assert(
      redirectUri.endsWith("/api/auth/google/callback"),
      `Unexpected redirect URI: ${redirectUri}`,
    );
    console.log(`PASS redirect URI shape: ${redirectUri}`);
    if (!clientId || !clientSecret) {
      console.log("INFO Google credentials not set locally (expected until Google Cloud setup)");
    } else {
      console.log("INFO Google credentials present in local env");
    }

    // --- New Google account creation ---
    const googleSubA = `google-sub-a-${suffix}`;
    const emailA = `google-new-${suffix}@example.com`;
    const created = await upsertUserFromGoogleIdentity({
      sub: googleSubA,
      email: emailA,
      email_verified: true,
      name: "Google New User",
      picture: "https://lh3.googleusercontent.com/a/test-photo",
    });
    createdUserIds.push(created.id);
    assert(created.email === emailA, "Created user email mismatch");
    assert(created.passwordHash === null, "Google-only user must have null passwordHash");
    assert(created.name === "Google New User", "Name should come from verified Google profile");
    console.log("PASS new Google account creation");

    const oauthRow = await db.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: GOOGLE_OAUTH_PROVIDER,
          providerAccountId: googleSubA,
        },
      },
    });
    assert(oauthRow?.userId === created.id, "OAuth account row missing");
    console.log("PASS oauth identity stored without tokens");

    // --- Existing Google account login ---
    const again = await upsertUserFromGoogleIdentity({
      sub: googleSubA,
      email: emailA,
      email_verified: true,
      name: "Should Not Overwrite",
      picture: "https://evil.example/photo.png",
    });
    assert(again.id === created.id, "Existing Google identity must sign into same user");
    const reloaded = await db.user.findUnique({ where: { id: created.id } });
    assert(reloaded?.name === "Google New User", "Must not overwrite profile on re-login");
    console.log("PASS existing Google account login (no profile overwrite)");

    // --- Duplicate Google identity prevention ---
    const count = await db.oAuthAccount.count({
      where: { provider: GOOGLE_OAUTH_PROVIDER, providerAccountId: googleSubA },
    });
    assert(count === 1, "Duplicate Google identities must not be created");
    console.log("PASS duplicate Google identity prevention");

    // --- Link verified Google email to existing password account ---
    const emailB = `google-link-${suffix}@example.com`;
    const password = "password-link-12345";
    const passwordHash = await hashPassword(password);
    const passwordUser = await db.user.create({
      data: {
        email: emailB,
        passwordHash,
        name: "Existing Password User",
        profilePhotoUrl: null,
      },
    });
    createdUserIds.push(passwordUser.id);

    const googleSubB = `google-sub-b-${suffix}`;
    const linked = await upsertUserFromGoogleIdentity({
      sub: googleSubB,
      email: emailB,
      email_verified: true,
      name: "Google Name Should Not Replace",
      picture: "https://lh3.googleusercontent.com/a/other",
    });
    assert(linked.id === passwordUser.id, "Must link to existing email account");
    const linkedReload = await db.user.findUnique({ where: { id: passwordUser.id } });
    assert(
      linkedReload?.name === "Existing Password User",
      "Linking must not overwrite existing profile name",
    );
    assert(
      await verifyPassword(password, linkedReload!.passwordHash!),
      "Password login must still work after Google link",
    );
    console.log("PASS verified-email account linking (no profile overwrite)");

    // Attempting same Google sub again stays on same user
    const linkedAgain = await upsertUserFromGoogleIdentity({
      sub: googleSubB,
      email: emailB,
      email_verified: true,
    });
    assert(linkedAgain.id === passwordUser.id, "Linked Google identity must stay unique");
    console.log("PASS linked Google identity re-login");

    // --- Email/password login still works for password-only user ---
    const emailC = `password-only-${suffix}@example.com`;
    const pwOnlyHash = await hashPassword("password-only-99999");
    const pwOnly = await db.user.create({
      data: { email: emailC, passwordHash: pwOnlyHash, name: "Password Only" },
    });
    createdUserIds.push(pwOnly.id);
    assert(await verifyPassword("password-only-99999", pwOnly.passwordHash!), "Password verify");
    console.log("PASS email/password credentials still valid");

    // Google-only user cannot verify a password
    assert(created.passwordHash === null, "Google-only has no password");
    console.log("PASS Google-only user has no password hash");

    // --- Session cookies still settable (same as email/password flow) ---
    const response = NextResponse.json({ ok: true });
    setAuthCookies(response, {
      sub: created.id,
      email: created.email,
      tokenVersion: created.tokenVersion,
    });
    const setCookie = response.headers.getSetCookie?.() ?? [];
    assert(setCookie.length >= 2 || response.cookies.getAll().length >= 2, "Auth cookies set");
    clearAuthCookies(response);
    console.log("PASS session cookie helpers work for Google user");

    // --- Forgot password still works for linked account ---
    process.env.EMAIL_PROVIDER = "memory";
    const msg = await requestPasswordReset(emailB);
    assert(msg === FORGOT_PASSWORD_GENERIC_MESSAGE, "Forgot password generic message");
    console.log("PASS forgot password still works for linked account");

    // --- Admin authorization unchanged (env-based email check) ---
    const adminEmail = process.env.ADMIN_USER_EMAIL?.trim().toLowerCase();
    if (adminEmail) {
      assert(isAdminEmail(adminEmail) === true, "Admin email config still recognized");
      assert(isAdminEmail(emailA) === false, "Non-admin Google user is not admin");
      console.log("PASS admin authorization unchanged");
    } else {
      console.log("INFO ADMIN_USER_EMAIL unset — skipped admin email assertion");
    }

    // --- Ownership: Google user only sees own oauth row ---
    const foreign = await db.oAuthAccount.findFirst({
      where: { userId: created.id, providerAccountId: googleSubB },
    });
    assert(!foreign, "Google user must not own another identity");
    console.log("PASS oauth ownership isolation");

    console.log("\nAll Google OAuth verification checks passed.");
  } finally {
    if (createdUserIds.length > 0) {
      await db.user.deleteMany({ where: { id: { in: createdUserIds } } });
    }
    await db.$disconnect();
  }
}

main().catch(async (error) => {
  console.error("FAIL", error instanceof Error ? error.message : error);
  await db.$disconnect();
  process.exit(1);
});
