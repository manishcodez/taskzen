import { redirect } from "next/navigation";

import { isAdminUser } from "@/lib/auth/admin";
import { getCurrentUser } from "@/lib/auth/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user || !isAdminUser(user)) {
    redirect("/dashboard");
  }

  return children;
}
