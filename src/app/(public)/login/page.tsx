import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";
import { AuthFormSkeleton } from "@/components/shared/loading-skeleton";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center px-4 py-10 md:px-6">
      <Suspense fallback={<AuthFormSkeleton />}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
