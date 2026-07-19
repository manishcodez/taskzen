"use client";

import { ErrorState } from "@/components/shared/error-state";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-lg pt-16">
          <ErrorState
            title="Application error"
            message={error.message || "Something went wrong while loading Taskzen."}
            onRetry={reset}
          />
        </div>
      </body>
    </html>
  );
}
