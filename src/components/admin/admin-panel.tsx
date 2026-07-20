"use client";

import { useState } from "react";
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Clock3,
  Database,
  Layers3,
  ListTodo,
  Server,
  Settings2,
  ShieldCheck,
  Users,
  UserPlus,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import { AdminTrendChart } from "@/components/admin/admin-trend-chart";
import { PageHeader } from "@/components/layout/page-header";
import { ErrorState } from "@/components/shared/error-state";
import { AnalyticsSkeleton } from "@/components/shared/loading-skeleton";
import {
  useAdminActivity,
  useAdminHealth,
  useAdminOverview,
  useAdminProduct,
  useAdminSettings,
  useAdminUsers,
} from "@/hooks/use-admin";
import { CHART_COLORS, CHART_TOOLTIP_STYLE } from "@/lib/analytics/chart-theme";
import { cn } from "@/lib/utils";

const adminSections = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "users", label: "User Analytics", icon: Users },
  { id: "product", label: "Product Analytics", icon: Layers3 },
  { id: "health", label: "System Health", icon: Server },
  { id: "activity", label: "Activity & Events", icon: Activity },
  { id: "settings", label: "Admin Settings", icon: Settings2 },
] as const;

type AdminSectionId = (typeof adminSections)[number]["id"];

function SectionTabs({
  active,
  onChange,
}: {
  active: AdminSectionId;
  onChange: (section: AdminSectionId) => void;
}) {
  return (
    <div className="mb-6 -mx-1 overflow-x-auto pb-1">
      <div className="flex min-w-max gap-2 px-1">
        {adminSections.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;

          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={cn(
                "inline-flex min-h-10 items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition-colors sm:px-4 sm:text-sm",
                isActive
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border/80 bg-card/70 text-muted-foreground hover:bg-muted/70 hover:text-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="whitespace-nowrap">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function OverviewSection() {
  const { data, isLoading, isError, refetch } = useAdminOverview();

  if (isLoading) return <AnalyticsSkeleton />;
  if (isError || !data) {
    return <ErrorState message="Unable to load overview statistics." onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard title="Total users" value={data.totalUsers} icon={Users} tone="primary" />
        <AdminMetricCard
          title="Active users"
          value={data.activeUsers}
          description="Active in the last 30 days"
          icon={Activity}
        />
        <AdminMetricCard
          title="New users"
          value={data.newUsersLast7Days}
          description="Registered in the last 7 days"
          icon={UserPlus}
          tone="success"
        />
        <AdminMetricCard
          title="Completion rate"
          value={`${data.completionRate}%`}
          description="Platform-wide task completion"
          icon={CheckCircle2}
          tone="success"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard title="Subjects created" value={data.totalSubjects} icon={Layers3} />
        <AdminMetricCard title="Tasks created" value={data.totalTasks} icon={ListTodo} />
        <AdminMetricCard
          title="Completed tasks"
          value={data.completedTasks}
          icon={CheckCircle2}
          tone="success"
        />
        <AdminMetricCard title="Pending tasks" value={data.pendingTasks} icon={Clock3} tone="warning" />
      </div>

      <div className="rounded-[1.25rem] border border-border/80 bg-card/80 p-4 text-sm text-muted-foreground">
        Privacy-safe aggregate metrics only. No personal task content, subject names, or user-written
        notes are exposed in this panel.
      </div>
    </div>
  );
}

function UsersSection() {
  const { data, isLoading, isError, refetch } = useAdminUsers();

  if (isLoading) return <AnalyticsSkeleton />;
  if (isError || !data) {
    return <ErrorState message="Unable to load user analytics." onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard title="Total users" value={data.totalUsers} icon={Users} tone="primary" />
        <AdminMetricCard title="Active users" value={data.activeUsers} icon={Activity} />
        <AdminMetricCard title="New (7 days)" value={data.newUsersLast7Days} icon={UserPlus} />
        <AdminMetricCard title="New (30 days)" value={data.newUsersLast30Days} icon={UserPlus} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <AdminTrendChart
          data={data.registrationTrend}
          title="Registration trend"
          badge="Last 30 days"
          valueLabel="Registrations"
          variant="area"
          color={CHART_COLORS.primary}
        />
        <AdminTrendChart
          data={data.weeklyRegistrations}
          title="Weekly registrations"
          badge="Recent weeks"
          valueLabel="Registrations"
        />
      </div>

      <AdminTrendChart
        data={data.monthlyRegistrations}
        title="Monthly registrations"
        badge="Recent months"
        valueLabel="Registrations"
        variant="area"
        color={CHART_COLORS.accent}
      />
    </div>
  );
}

function ProductSection() {
  const { data, isLoading, isError, refetch } = useAdminProduct();

  if (isLoading) return <AnalyticsSkeleton />;
  if (isError || !data) {
    return <ErrorState message="Unable to load product analytics." onRetry={() => refetch()} />;
  }

  const statusData = [
    { name: "Completed", value: data.taskStatusBreakdown.completed, color: CHART_COLORS.completed },
    { name: "Pending", value: data.taskStatusBreakdown.pending, color: CHART_COLORS.pending },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard
          title="Users with subjects"
          value={data.featureEngagement.usersWithSubjects}
          icon={Layers3}
        />
        <AdminMetricCard
          title="Users with tasks"
          value={data.featureEngagement.usersWithTasks}
          icon={ListTodo}
        />
        <AdminMetricCard
          title="Users completing tasks"
          value={data.featureEngagement.usersWithCompletedTasks}
          icon={CheckCircle2}
          tone="success"
        />
        <AdminMetricCard
          title="Users with scheduled tasks"
          value={data.featureEngagement.usersWithScheduledTasks}
          description="Calendar-related usage proxy"
          icon={Clock3}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <AdminTrendChart
          data={data.tasksCreatedTrend}
          title="Tasks created"
          badge="Last 30 days"
          valueLabel="Tasks created"
        />
        <AdminTrendChart
          data={data.tasksCompletedTrend}
          title="Tasks completed"
          badge="Last 30 days"
          valueLabel="Tasks completed"
          color={CHART_COLORS.completed}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <AdminTrendChart
          data={data.subjectsCreatedTrend}
          title="Subjects created"
          badge="Last 30 days"
          valueLabel="Subjects created"
          variant="area"
          color={CHART_COLORS.accent}
        />

        <div className="min-w-0 overflow-hidden rounded-[1.25rem] border border-primary/10 bg-gradient-to-b from-primary/5 via-card/50 to-background p-4 shadow-soft">
          <div className="mb-3">
            <p className="label-caps text-primary">Task status breakdown</p>
          </div>
          <div className="h-64 min-w-0 w-full sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={56}
                  outerRadius={88}
                  paddingAngle={3}
                >
                  {statusData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function HealthSection() {
  const { data, isLoading, isError, refetch } = useAdminHealth();

  if (isLoading) return <AnalyticsSkeleton />;
  if (isError || !data) {
    return <ErrorState message="Unable to load system health." onRetry={() => refetch()} />;
  }

  const dbHealthy = data.database.status === "healthy";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 xl:grid-cols-3">
        <AdminMetricCard
          title="Database"
          value={dbHealthy ? "Healthy" : "Unhealthy"}
          description={
            data.database.latencyMs !== null
              ? `Response time: ${data.database.latencyMs}ms`
              : "Connection check failed"
          }
          icon={Database}
          tone={dbHealthy ? "success" : "warning"}
        />
        <AdminMetricCard
          title="API status"
          value="Healthy"
          description="Admin API endpoints responding"
          icon={Server}
          tone="success"
        />
        <AdminMetricCard
          title="Environment"
          value={data.application.environment}
          description={`Version ${data.application.version}`}
          icon={ShieldCheck}
        />
      </div>

      <div className="rounded-[1.25rem] border border-border/80 bg-card/80 p-4 text-sm text-muted-foreground">
        Last checked: {new Date(data.checkedAt).toLocaleString()}. Infrastructure secrets, database
        URLs, and environment variables are never exposed here.
      </div>
    </div>
  );
}

function ActivitySection() {
  const { data, isLoading, isError, refetch } = useAdminActivity();

  if (isLoading) return <AnalyticsSkeleton />;
  if (isError || !data) {
    return <ErrorState message="Unable to load activity statistics." onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard title="Registrations" value={data.totals.registrations} icon={UserPlus} />
        <AdminMetricCard title="Tasks created" value={data.totals.taskCreations} icon={ListTodo} />
        <AdminMetricCard
          title="Tasks completed"
          value={data.totals.taskCompletions}
          icon={CheckCircle2}
          tone="success"
        />
        <AdminMetricCard title="Subjects created" value={data.totals.subjectCreations} icon={Layers3} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <AdminTrendChart
          data={data.registrationTrend}
          title="Registration events"
          badge="Last 30 days"
          valueLabel="Registrations"
          variant="area"
          color={CHART_COLORS.primary}
        />
        <AdminTrendChart
          data={data.taskCreationTrend}
          title="Task creation events"
          badge="Last 30 days"
          valueLabel="Tasks created"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <AdminTrendChart
          data={data.taskCompletionTrend}
          title="Task completion events"
          badge="Last 30 days"
          valueLabel="Tasks completed"
          color={CHART_COLORS.completed}
        />
        <AdminTrendChart
          data={data.subjectCreationTrend}
          title="Subject creation events"
          badge="Last 30 days"
          valueLabel="Subjects created"
          variant="area"
          color={CHART_COLORS.accent}
        />
      </div>

      <div className="rounded-[1.25rem] border border-border/80 bg-card/80 p-4 text-sm text-muted-foreground">
        {data.loginTracking.message}
      </div>
    </div>
  );
}

function SettingsSection() {
  const { data, isLoading, isError, refetch } = useAdminSettings();

  if (isLoading) return <AnalyticsSkeleton />;
  if (isError || !data) {
    return <ErrorState message="Unable to load admin settings." onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2">
        <AdminMetricCard
          title="Admin access"
          value={data.adminAccess.accountStatus === "active" ? "Active" : "Misconfigured"}
          description={
            data.adminAccess.configured
              ? "Administrator email configured on the server"
              : "Set ADMIN_USER_EMAIL in server environment"
          }
          icon={ShieldCheck}
          tone={data.adminAccess.configured ? "success" : "warning"}
        />
        <AdminMetricCard
          title="Authorization"
          value="Server-side"
          description="JWT cookie auth with admin middleware and API guards"
          icon={Server}
          tone="primary"
        />
      </div>

      <div className="rounded-[1.25rem] border border-border/80 bg-card/80 p-5">
        <h2 className="font-display text-lg font-semibold">Platform configuration</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
            <dt className="text-muted-foreground">Application</dt>
            <dd className="font-medium">{data.application.name}</dd>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
            <dt className="text-muted-foreground">Version</dt>
            <dd className="font-medium">{data.application.version}</dd>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
            <dt className="text-muted-foreground">Environment</dt>
            <dd className="font-medium capitalize">{data.application.environment}</dd>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="text-muted-foreground">Admin env configured</dt>
            <dd className="font-medium">{data.security.adminEnvConfigured ? "Yes" : "No"}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

export function AdminPanel() {
  const [activeSection, setActiveSection] = useState<AdminSectionId>("overview");

  return (
    <div className="min-w-0">
      <PageHeader
        eyebrow="Administrator"
        title="Admin Panel"
        description="Privacy-first platform insights. Aggregate usage statistics only — no personal user content."
      />

      <SectionTabs active={activeSection} onChange={setActiveSection} />

      {activeSection === "overview" ? <OverviewSection /> : null}
      {activeSection === "users" ? <UsersSection /> : null}
      {activeSection === "product" ? <ProductSection /> : null}
      {activeSection === "health" ? <HealthSection /> : null}
      {activeSection === "activity" ? <ActivitySection /> : null}
      {activeSection === "settings" ? <SettingsSection /> : null}
    </div>
  );
}
