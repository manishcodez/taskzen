import { redirect } from "next/navigation";

import { AuthSessionGuard } from "@/components/auth/auth-session-guard";
import { AppShell } from "@/components/layout/app-shell";
import { getCurrentUser } from "@/lib/auth/session";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <>
      <AuthSessionGuard />
      <AppShell user={user}>{children}</AppShell>
    </>
  );
}
