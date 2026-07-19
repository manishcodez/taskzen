"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ListTodo,
  Plus,
} from "lucide-react";

import { ProgressOverview } from "@/components/dashboard/progress-overview";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { TaskWidgetList } from "@/components/dashboard/task-widget-list";
import { WorkloadOverview } from "@/components/dashboard/workload-overview";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { DashboardSkeleton } from "@/components/shared/loading-skeleton";
import { Button } from "@/components/ui/button";
import { getClientTimezoneOffset } from "@/lib/utils/date-ranges";
import { useDashboard } from "@/hooks/use-dashboard";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { fadeUp, staggerContainer } from "@/lib/motion";

type DashboardViewProps = {
  userName?: string | null;
};

export function DashboardView({ userName }: DashboardViewProps) {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const tzOffset = getClientTimezoneOffset();
  const { data, isLoading, isError, error, refetch } = useDashboard(tzOffset);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (isError || !data) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : "Unable to load dashboard."}
        onRetry={() => refetch()}
      />
    );
  }

  const { counts } = data;
  const hasTasks = counts.total > 0;

  return (
    <motion.div
      className="space-y-8"
      variants={staggerContainer(0.06, 0.02)}
      initial={prefersReducedMotion ? false : "hidden"}
      animate="show"
    >
      <motion.div variants={fadeUp}>
        <PageHeader
          eyebrow="Dashboard"
          title={`Welcome${userName ? `, ${userName}` : ""}`}
          description="Your academic overview, deadlines, and workload at a glance."
          action={
            <Button render={<Link href="/tasks/new" />}>
              <Plus className="h-4 w-4" />
              Add task
            </Button>
          }
        />
      </motion.div>

      {!hasTasks ? (
        <motion.div variants={fadeUp}>
          <EmptyState
            title="No tasks yet"
            description="Create subjects and tasks to populate your dashboard with deadlines, progress, and workload insights."
            actionLabel="Create your first task"
            onAction={() => router.push("/tasks/new")}
          />
        </motion.div>
      ) : null}

      {hasTasks ? (
        <>
          <div className="grid gap-4 md:grid-cols-6 lg:grid-cols-12">
            <div className="md:col-span-6 lg:col-span-5 lg:row-span-2">
              <SummaryCard
                title="Completed"
                value={counts.completed}
                description={`${counts.completionPercentage}% of your workload done`}
                icon={CheckCircle2}
                tone="success"
                hero
              />
            </div>

            <div className="grid grid-cols-2 gap-4 md:col-span-6 lg:col-span-7">
              <SummaryCard title="Total tasks" value={counts.total} icon={ListTodo} tone="info" />
              <SummaryCard title="Pending" value={counts.pending} icon={Clock3} />
              <SummaryCard
                title="Overdue"
                value={counts.overdue}
                icon={AlertTriangle}
                tone={counts.overdue > 0 ? "danger" : "default"}
                featured={counts.overdue > 0}
              />
              <SummaryCard
                title="Due today"
                value={counts.dueToday}
                icon={CalendarDays}
                tone={counts.dueToday > 0 ? "warning" : "default"}
              />
            </div>

            <div className="md:col-span-3 lg:col-span-4">
              <SummaryCard
                title="Due this week"
                value={counts.dueThisWeek}
                icon={CalendarDays}
                tone="default"
                featured
              />
            </div>
          </div>

          <ProgressOverview counts={counts} />

          <div className="grid gap-4 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <TaskWidgetList
                title="Today's tasks"
                description="Tasks scheduled for today."
                tasks={data.todaysTasks}
                emptyTitle="Nothing due today"
                emptyDescription="You have no tasks due today."
                accent="primary"
              />
            </div>
            <div className="space-y-4 lg:col-span-5">
              <TaskWidgetList
                title="Upcoming deadlines"
                description="Next non-completed tasks with due dates."
                tasks={data.upcomingDeadlines}
                emptyTitle="No upcoming deadlines"
                emptyDescription="Add due dates to tasks to track upcoming work."
                accent="secondary"
                compact
              />
              <TaskWidgetList
                title="High & urgent priority"
                description="Important tasks that still need attention."
                tasks={data.priorityTasks}
                emptyTitle="No high-priority tasks"
                emptyDescription="High and urgent tasks will appear here."
                accent="accent"
                compact
              />
            </div>
          </div>

          <WorkloadOverview items={data.workloadOverview} />
        </>
      ) : null}
    </motion.div>
  );
}
