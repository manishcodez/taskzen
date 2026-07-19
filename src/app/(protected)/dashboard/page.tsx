import { DashboardView } from "@/components/dashboard/dashboard-view";
import { getCurrentUser } from "@/lib/auth/session";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  return <DashboardView userName={user?.name} />;
}
