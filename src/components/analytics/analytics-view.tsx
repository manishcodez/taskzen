"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  CalendarRange,
  Flame,
  Percent,
  Target,
  TrendingUp,
  Trophy,
} from "lucide-react";

import { SubjectWorkloadChart } from "@/components/analytics/subject-workload-chart";
import { TaskStatusChart } from "@/components/analytics/task-status-chart";
import { WeeklyCompletionChart } from "@/components/analytics/weekly-completion-chart";
import { PageHeader } from "@/components/layout/page-header";
import { MotionDiv } from "@/components/motion/motion-div";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { AnalyticsSkeleton } from "@/components/shared/loading-skeleton";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { getClientTimezoneOffset } from "@/lib/utils/date-ranges";
import { useAnalytics } from "@/hooks/use-analytics";
import { cn } from "@/lib/utils";
import { fadeUp, staggerContainer } from "@/lib/motion";

type MetricCardProps = {
  title: string;
  value: number | string;
  description?: string;
  icon?: LucideIcon;
  tone?: "default" | "success" | "warning" | "danger";
  featured?: boolean;
  className?: string;
};

const toneStyles = {
  default: {
    value: "text-foreground",
    icon: "bg-primary/10 text-primary",
    border: "border-border/80",
  },
  success: {
    value: "text-success",
    icon: "bg-success/12 text-success",
    border: "border-success/20",
  },
  warning: {
    value: "text-warning-foreground",
    icon: "bg-warning/20 text-warning-foreground",
    border: "border-warning/25",
  },
  danger: {
    value: "text-destructive",
    icon: "bg-destructive/10 text-destructive",
    border: "border-destructive/20",
  },
} as const;

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  tone = "default",
  featured = false,
  className,
}: MetricCardProps) {
  const styles = toneStyles[tone];

  return (
    <motion.div
      variants={fadeUp}
      className={cn(
        "bg-panel surface-interactive flex h-full flex-col justify-between p-5",
        styles.border,
        featured && "border-primary/25 bg-gradient-to-br from-primary/10 via-card/90 to-accent/5",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="label-caps">{title}</p>
        {Icon ? (
          <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", styles.icon)}>
            <Icon className="h-4 w-4" />
          </div>
        ) : null}
      </div>
      <div className="mt-4">
        <p className={cn("metric-display text-3xl md:text-4xl", styles.value)}>{value}</p>
        {description ? (
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </div>
    </motion.div>
  );
}

function ChartPanel({
  title,
  description,
  children,
  className,
  accent = "primary",
}: {
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
  accent?: "primary" | "accent" | "secondary";
}) {
  const headerGradients = {
    primary: "from-primary/10 via-accent/5 to-transparent",
    secondary: "from-brand-secondary/10 via-primary/5 to-transparent",
    accent: "from-accent/12 via-primary/5 to-transparent",
  };

  return (
    <motion.div variants={fadeUp} className={cn("bg-panel overflow-hidden", className)}>
      <div className={cn("border-b border-border/60 bg-gradient-to-r px-5 py-4", headerGradients[accent])}>
        <p className="label-caps text-primary">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="p-5">{children}</div>
    </motion.div>
  );
}

export function AnalyticsView() {
  const prefersReducedMotion = useReducedMotion();
  const tzOffset = getClientTimezoneOffset();
  const { data, isLoading, isError, error, refetch } = useAnalytics(tzOffset);

  if (isLoading) {
    return <AnalyticsSkeleton />;
  }

  if (isError || !data) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : "Unable to load analytics."}
        onRetry={() => refetch()}
      />
    );
  }

  const { summary } = data;
  const hasTasks = summary.totalTasks > 0;
  const hasCompletedTasks = summary.totalCompleted > 0;
  const hasTrendData = data.weeklyCompletionTrend.some((item) => item.completed > 0);
  const hasSubjectData = data.subjectWorkload.length > 0;

  return (
    <MotionDiv
      initial={prefersReducedMotion ? false : "hidden"}
      animate="show"
      variants={staggerContainer(0.06, 0.03)}
      className="space-y-8"
    >
      <motion.div variants={fadeUp}>
        <PageHeader
          eyebrow="Analytics"
          title="Productivity insights"
          description="Track completion rates, productivity trends, and subject workload over time."
        />
      </motion.div>

      {!hasTasks ? (
        <motion.div variants={fadeUp}>
          <EmptyState
            title="No analytics yet"
            description="Create tasks and complete them to unlock productivity insights and charts."
          />
        </motion.div>
      ) : null}

      <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-12">
        <MetricCard
          title="Completion rate"
          value={`${summary.completionRate}%`}
          icon={Percent}
          tone="success"
          featured
          className="sm:col-span-2 xl:col-span-4 xl:row-span-2"
        />
        <MetricCard
          title="Total completed"
          value={summary.totalCompleted}
          icon={Trophy}
          tone="success"
          className="xl:col-span-4"
        />
        <MetricCard
          title="Completed this week"
          value={summary.completedThisWeek}
          icon={TrendingUp}
          className="xl:col-span-4"
        />
        <MetricCard
          title="Completed this month"
          value={summary.completedThisMonth}
          icon={CalendarRange}
          className="xl:col-span-4"
        />
        <MetricCard
          title="Productivity streak"
          value={`${summary.productivityStreak} day${summary.productivityStreak === 1 ? "" : "s"}`}
          icon={Flame}
          tone={summary.productivityStreak > 0 ? "warning" : "default"}
          description="Consecutive days with at least one completed task"
          className="xl:col-span-4"
        />
        <MetricCard
          title="Most productive day"
          value={summary.mostProductiveDay ?? "—"}
          icon={Target}
          className="xl:col-span-4"
        />
        <MetricCard
          title="Overdue tasks"
          value={summary.overdueCount}
          icon={AlertTriangle}
          tone={summary.overdueCount > 0 ? "danger" : "default"}
          className="xl:col-span-4"
        />
        <MetricCard
          title="Pending tasks"
          value={summary.pendingTasks}
          icon={TrendingUp}
          className="xl:col-span-4"
        />
      </div>

      {hasTasks ? (
        <div className="grid gap-5 xl:grid-cols-12">
          <ChartPanel
            title="Weekly completion trend"
            description="Completed tasks over the last 8 weeks."
            accent="primary"
            className="xl:col-span-7 xl:row-span-2"
          >
            {hasTrendData ? (
              <WeeklyCompletionChart data={data.weeklyCompletionTrend} />
            ) : (
              <EmptyState
                title="No completion trend yet"
                description="Complete tasks to build your weekly productivity trend."
              />
            )}
          </ChartPanel>

          <ChartPanel
            title="Pending vs completed"
            description="Overall task status distribution."
            accent="accent"
            className="xl:col-span-5"
          >
            {hasCompletedTasks || summary.pendingTasks > 0 ? (
              <TaskStatusChart
                completed={data.taskStatusBreakdown.completed}
                pending={data.taskStatusBreakdown.pending}
              />
            ) : (
              <EmptyState
                title="No status breakdown yet"
                description="Task status insights will appear once you add tasks."
              />
            )}
          </ChartPanel>

          <ChartPanel
            title="Subject workload breakdown"
            description="Completed and pending tasks grouped by subject."
            accent="secondary"
            className="xl:col-span-12"
          >
            {hasSubjectData ? (
              <SubjectWorkloadChart data={data.subjectWorkload} />
            ) : (
              <EmptyState
                title="No subject workload yet"
                description="Create subjects and tasks to see workload distribution."
              />
            )}
          </ChartPanel>
        </div>
      ) : null}
    </MotionDiv>
  );
}
