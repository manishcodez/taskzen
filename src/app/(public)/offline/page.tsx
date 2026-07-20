import Link from "next/link";

import { TaskzenLogo } from "@/components/brand/taskzen-logo";

export const metadata = {
  title: "Offline — Taskzen",
  robots: { index: false, follow: false },
};

/**
 * Public offline shell. Does not claim private data is available or saved.
 * Authenticated features require a network connection.
 */
export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-lg flex-col items-center justify-center px-4 py-12 text-center">
      <TaskzenLogo size="lg" />
      <h1 className="font-display mt-8 text-2xl font-semibold tracking-tight md:text-3xl">
        You&apos;re offline
      </h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
        Taskzen needs an internet connection to load your subjects, tasks, and account data. Nothing
        was saved while offline — reconnect and try again.
      </p>
      <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-soft transition hover:bg-primary/92"
        >
          Try again
        </Link>
        <Link
          href="/login"
          className="inline-flex h-11 items-center justify-center rounded-2xl border border-border/80 bg-card/80 px-5 text-sm font-semibold text-foreground shadow-soft transition hover:border-primary/25 hover:bg-primary/5"
        >
          Go to sign in
        </Link>
      </div>
    </main>
  );
}
