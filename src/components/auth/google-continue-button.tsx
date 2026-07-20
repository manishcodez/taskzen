"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { getSafeRedirectPath } from "@/lib/auth/safe-redirect";
import { cn } from "@/lib/utils";

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={cn("size-4", className)}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

const GOOGLE_ERROR_MESSAGES: Record<string, string> = {
  google_unavailable:
    "Google sign-in is not configured yet. Please use email and password, or try again later.",
  google_denied: "Google sign-in was cancelled. You can try again or use email and password.",
  google_state: "Google sign-in could not be verified. Please try again.",
  google_code: "Google sign-in did not return an authorization code. Please try again.",
  google_failed: "Google sign-in failed. Please try again or use email and password.",
  rate_limited: "Too many attempts. Please wait a few minutes and try again.",
};

export function getGoogleAuthErrorMessage(code: string | null | undefined): string | null {
  if (!code) return null;
  return GOOGLE_ERROR_MESSAGES[code] ?? null;
}

type GoogleContinueButtonProps = {
  redirectTo?: string | null;
  disabled?: boolean;
  className?: string;
};

export function GoogleContinueButton({
  redirectTo,
  disabled = false,
  className,
}: GoogleContinueButtonProps) {
  const [isStarting, setIsStarting] = useState(false);

  function startGoogleSignIn() {
    if (disabled || isStarting) return;
    setIsStarting(true);
    const safeRedirect = getSafeRedirectPath(redirectTo);
    const params = new URLSearchParams();
    if (safeRedirect !== "/dashboard") {
      params.set("redirect", safeRedirect);
    }
    const query = params.toString();
    window.location.assign(`/api/auth/google${query ? `?${query}` : ""}`);
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className={cn("w-full", className)}
      disabled={disabled || isStarting}
      onClick={startGoogleSignIn}
    >
      <GoogleMark />
      {isStarting ? "Redirecting to Google..." : "Continue with Google"}
    </Button>
  );
}

export function AuthMethodDivider() {
  return (
    <div className="relative flex items-center gap-3 py-1" role="separator" aria-label="or">
      <div className="h-px flex-1 bg-border/70" />
      <span className="label-caps text-[0.65rem] text-muted-foreground">Or</span>
      <div className="h-px flex-1 bg-border/70" />
    </div>
  );
}
