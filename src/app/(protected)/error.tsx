"use client";

import { ErrorState } from "@/components/shared/error-state";

export default function ProtectedError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Unable to load this page"
      message={error.message || "Please try again."}
      onRetry={reset}
    />
  );
}
