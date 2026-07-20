import type { Subject, Task } from "@/generated/prisma/client";

export {
  TaskPriority,
  TaskStatus,
  TaskType,
  type Subject,
  type Task,
  type User,
} from "@/generated/prisma/client";

export type TaskWithSubject = Task & {
  subject: Subject;
};

export type SubjectSummary = {
  id: string;
  name: string;
  code: string | null;
  color: string;
  description: string | null;
  taskCount: number;
  createdAt: string;
  updatedAt: string;
};

export type SubjectTaskSummary = {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  type: string;
};

export type SubjectDetail = SubjectSummary & {
  tasks: SubjectTaskSummary[];
};

export type TaskSubjectSummary = {
  id: string;
  name: string;
  color: string;
  code: string | null;
};

export type TaskItem = {
  id: string;
  subjectId: string;
  title: string;
  description: string | null;
  type: string;
  priority: string;
  status: string;
  dueDate: string | null;
  estimatedTimeMinutes: number | null;
  notes: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  isOverdue: boolean;
  subject: TaskSubjectSummary;
};

export type TaskListFilters = {
  q?: string;
  subjectId?: string;
  status?: string;
  priority?: string;
  type?: string;
  dueBefore?: string;
  dueAfter?: string;
  dueToday?: boolean;
  dueThisWeek?: boolean;
  completed?: boolean;
  overdue?: boolean;
  sortBy?: "dueDate" | "priority" | "createdAt" | "status" | "subject";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
  tzOffset?: number;
};

export type TaskListResponse = {
  items: TaskItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type DashboardCounts = {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  dueToday: number;
  dueThisWeek: number;
  completionPercentage: number;
};

export type WorkloadOverviewItem = {
  subjectId: string;
  subjectName: string;
  color: string;
  pendingCount: number;
  overdueCount: number;
  dueThisWeekCount: number;
};

export type DashboardData = {
  counts: DashboardCounts;
  todaysTasks: TaskItem[];
  upcomingDeadlines: TaskItem[];
  priorityTasks: TaskItem[];
  workloadOverview: WorkloadOverviewItem[];
};

export type CalendarData = {
  year: number;
  month: number;
  tasksByDate: Record<string, TaskItem[]>;
};

export type AnalyticsSummary = {
  completionRate: number;
  totalCompleted: number;
  completedThisWeek: number;
  completedThisMonth: number;
  productivityStreak: number;
  mostProductiveDay: string | null;
  overdueCount: number;
  totalTasks: number;
  pendingTasks: number;
};

export type WeeklyCompletionTrendItem = {
  weekLabel: string;
  weekStart: string;
  completed: number;
};

export type SubjectWorkloadItem = {
  subjectId: string;
  subjectName: string;
  color: string;
  total: number;
  completed: number;
  pending: number;
};

export type AnalyticsData = {
  summary: AnalyticsSummary;
  weeklyCompletionTrend: WeeklyCompletionTrendItem[];
  subjectWorkload: SubjectWorkloadItem[];
  taskStatusBreakdown: {
    completed: number;
    pending: number;
  };
};

export type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string[]>;
  };
};

export type {
  AdminActivityStats,
  AdminOverviewStats,
  AdminProductAnalytics,
  AdminSettingsInfo,
  AdminSystemHealth,
  AdminTrendPoint,
  AdminUserAnalytics,
} from "@/services/admin.service";
