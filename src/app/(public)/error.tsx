"use client";

import { ErrorState } from "@/components/shared/error-state";

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center px-4 py-10 md:px-6">
      <ErrorState
        title="Unable to load this page"
        message={error.message || "Please try again."}
        onRetry={reset}
      />
    </main>
  );
}
