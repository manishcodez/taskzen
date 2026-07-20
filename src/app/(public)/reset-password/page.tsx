import { Suspense } from "react";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { AuthFormSkeleton } from "@/components/shared/loading-skeleton";

export default function ResetPasswordPage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center px-4 py-10 md:px-6">
      <Suspense fallback={<AuthFormSkeleton />}>
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
