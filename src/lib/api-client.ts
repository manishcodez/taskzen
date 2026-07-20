import type { SafeUser } from "@/lib/auth/constants";
import type {
  AdminActivityStats,
  AdminOverviewStats,
  AdminProductAnalytics,
  AdminSettingsInfo,
  AdminSystemHealth,
  AdminUserAnalytics,
  AnalyticsData,
  ApiErrorResponse,
  CalendarData,
  DashboardData,
  SubjectDetail,
  SubjectSummary,
  TaskItem,
  TaskListFilters,
  TaskListResponse,
} from "@/types";

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly status?: number,
    public readonly fields?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

async function parseApiResponse<T>(response: Response): Promise<T> {
  const body = await response.json();

  if (!response.ok) {
    const error = body as ApiErrorResponse;
    throw new ApiRequestError(
      error.error?.message || "Request failed",
      error.error?.code,
      response.status,
      error.error?.fields,
    );
  }

  return body as T;
}

export async function fetchCurrentUser(): Promise<SafeUser> {
  const response = await fetch("/api/auth/me", {
    method: "GET",
    credentials: "include",
  });

  const data = await parseApiResponse<{ user: SafeUser }>(response);
  return data.user;
}

export async function fetchProfile(): Promise<SafeUser> {
  const response = await fetch("/api/profile", {
    method: "GET",
    credentials: "include",
  });

  const data = await parseApiResponse<{ user: SafeUser }>(response);
  return data.user;
}

export async function updateProfileRequest(input: {
  name?: string;
  course?: string;
  college?: string;
  semester?: string;
  academicYear?: string;
  profilePhotoUrl?: string;
}): Promise<SafeUser> {
  const response = await fetch("/api/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });

  const data = await parseApiResponse<{ user: SafeUser }>(response);
  return data.user;
}

export async function uploadProfilePhotoRequest(file: File): Promise<SafeUser> {
  const formData = new FormData();
  formData.append("photo", file);

  const response = await fetch("/api/upload/profile-photo", {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  const data = await parseApiResponse<{ user: SafeUser }>(response);
  return data.user;
}

export async function changePasswordRequest(input: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<void> {
  const response = await fetch("/api/profile/password", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });

  await parseApiResponse<{ success: boolean }>(response);
}

export async function fetchSubjects(): Promise<SubjectSummary[]> {
  const response = await fetch("/api/subjects", {
    method: "GET",
    credentials: "include",
  });

  const data = await parseApiResponse<{ subjects: SubjectSummary[] }>(response);
  return data.subjects;
}

export async function fetchSubject(id: string): Promise<SubjectDetail> {
  const response = await fetch(`/api/subjects/${id}`, {
    method: "GET",
    credentials: "include",
  });

  const data = await parseApiResponse<{ subject: SubjectDetail }>(response);
  return data.subject;
}

export async function createSubjectRequest(input: {
  name: string;
  code?: string;
  color: string;
  description?: string;
}): Promise<SubjectSummary> {
  const response = await fetch("/api/subjects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });

  const data = await parseApiResponse<{ subject: SubjectSummary }>(response);
  return data.subject;
}

export async function updateSubjectRequest(
  id: string,
  input: {
    name?: string;
    code?: string;
    color?: string;
    description?: string;
  },
): Promise<SubjectSummary> {
  const response = await fetch(`/api/subjects/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });

  const data = await parseApiResponse<{ subject: SubjectSummary }>(response);
  return data.subject;
}

export async function deleteSubjectRequest(id: string): Promise<void> {
  const response = await fetch(`/api/subjects/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  await parseApiResponse<{ success: boolean }>(response);
}

function buildTaskQueryParams(filters: TaskListFilters): string {
  const params = new URLSearchParams();

  if (filters.q) params.set("q", filters.q);
  if (filters.subjectId) params.set("subjectId", filters.subjectId);
  if (filters.status) params.set("status", filters.status);
  if (filters.priority) params.set("priority", filters.priority);
  if (filters.type) params.set("type", filters.type);
  if (filters.dueBefore) params.set("dueBefore", filters.dueBefore);
  if (filters.dueAfter) params.set("dueAfter", filters.dueAfter);
  if (filters.dueToday) params.set("dueToday", "true");
  if (filters.dueThisWeek) params.set("dueThisWeek", "true");
  if (filters.completed === true) params.set("completed", "true");
  if (filters.completed === false) params.set("completed", "false");
  if (filters.overdue === true) params.set("overdue", "true");
  if (filters.overdue === false) params.set("overdue", "false");
  if (filters.sortBy) params.set("sortBy", filters.sortBy);
  if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.tzOffset !== undefined) params.set("tzOffset", String(filters.tzOffset));

  return params.toString();
}

export async function fetchTasks(
  filters: TaskListFilters,
  signal?: AbortSignal,
): Promise<TaskListResponse> {
  const query = buildTaskQueryParams(filters);
  const response = await fetch(`/api/tasks${query ? `?${query}` : ""}`, {
    method: "GET",
    credentials: "include",
    signal,
  });

  return parseApiResponse<TaskListResponse>(response);
}

export async function fetchTask(id: string): Promise<TaskItem> {
  const response = await fetch(`/api/tasks/${id}`, {
    method: "GET",
    credentials: "include",
  });

  const data = await parseApiResponse<{ task: TaskItem }>(response);
  return data.task;
}

export async function createTaskRequest(input: {
  title: string;
  description?: string;
  subjectId: string;
  type: string;
  priority: string;
  status: string;
  dueDate?: string;
  estimatedTimeMinutes?: number | null;
  notes?: string;
}): Promise<TaskItem> {
  const response = await fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });

  const data = await parseApiResponse<{ task: TaskItem }>(response);
  return data.task;
}

export async function updateTaskRequest(
  id: string,
  input: {
    title?: string;
    description?: string;
    subjectId?: string;
    type?: string;
    priority?: string;
    status?: string;
    dueDate?: string | null;
    estimatedTimeMinutes?: number | null;
    notes?: string;
  },
): Promise<TaskItem> {
  const response = await fetch(`/api/tasks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });

  const data = await parseApiResponse<{ task: TaskItem }>(response);
  return data.task;
}

export async function deleteTaskRequest(id: string): Promise<void> {
  const response = await fetch(`/api/tasks/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  await parseApiResponse<{ success: boolean }>(response);
}

export async function completeTaskRequest(id: string): Promise<TaskItem> {
  const response = await fetch(`/api/tasks/${id}/complete`, {
    method: "PATCH",
    credentials: "include",
  });

  const data = await parseApiResponse<{ task: TaskItem }>(response);
  return data.task;
}

export async function reopenTaskRequest(id: string): Promise<TaskItem> {
  const response = await fetch(`/api/tasks/${id}/reopen`, {
    method: "PATCH",
    credentials: "include",
  });

  const data = await parseApiResponse<{ task: TaskItem }>(response);
  return data.task;
}

export async function fetchDashboard(tzOffset?: number): Promise<DashboardData> {
  const params = new URLSearchParams();
  if (tzOffset !== undefined) {
    params.set("tzOffset", String(tzOffset));
  }

  const query = params.toString();
  const response = await fetch(`/api/dashboard${query ? `?${query}` : ""}`, {
    method: "GET",
    credentials: "include",
  });

  const data = await parseApiResponse<{ dashboard: DashboardData }>(response);
  return data.dashboard;
}

export async function fetchCalendar(
  year: number,
  month: number,
  tzOffset?: number,
): Promise<CalendarData> {
  const params = new URLSearchParams({
    year: String(year),
    month: String(month),
  });

  if (tzOffset !== undefined) {
    params.set("tzOffset", String(tzOffset));
  }

  const response = await fetch(`/api/calendar?${params.toString()}`, {
    method: "GET",
    credentials: "include",
  });

  const data = await parseApiResponse<{ calendar: CalendarData }>(response);
  return data.calendar;
}

export async function fetchAnalytics(tzOffset?: number): Promise<AnalyticsData> {
  const params = new URLSearchParams();
  if (tzOffset !== undefined) {
    params.set("tzOffset", String(tzOffset));
  }

  const query = params.toString();
  const response = await fetch(`/api/analytics${query ? `?${query}` : ""}`, {
    method: "GET",
    credentials: "include",
  });

  const data = await parseApiResponse<{ analytics: AnalyticsData }>(response);
  return data.analytics;
}

export async function loginRequest(input: {
  email: string;
  password: string;
}): Promise<SafeUser> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });

  try {
    const data = await parseApiResponse<{ user: SafeUser }>(response);
    return data.user;
  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw {
        message: error.message,
        fields: error.fields,
      };
    }

    throw error;
  }
}

export async function registerRequest(input: {
  email: string;
  password: string;
  name?: string;
}): Promise<SafeUser> {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });

  try {
    const data = await parseApiResponse<{ user: SafeUser }>(response);
    return data.user;
  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw {
        message: error.message,
        fields: error.fields,
      };
    }

    throw error;
  }
}

export async function logoutRequest(): Promise<void> {
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });
}

export async function forgotPasswordRequest(input: { email: string }): Promise<string> {
  const response = await fetch("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });

  const data = await parseApiResponse<{ message: string }>(response);
  return data.message;
}

export async function resetPasswordRequest(input: {
  token: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<string> {
  const response = await fetch("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });

  const data = await parseApiResponse<{ message: string }>(response);
  return data.message;
}

async function fetchAdminResource<T>(path: string, key: keyof T): Promise<T[typeof key]> {
  const response = await fetch(path, {
    method: "GET",
    credentials: "include",
  });

  const data = await parseApiResponse<T>(response);
  return data[key];
}

export async function fetchAdminOverview(): Promise<AdminOverviewStats> {
  return fetchAdminResource<{ overview: AdminOverviewStats }>("/api/admin/overview", "overview");
}

export async function fetchAdminUsers(): Promise<AdminUserAnalytics> {
  return fetchAdminResource<{ users: AdminUserAnalytics }>("/api/admin/users", "users");
}

export async function fetchAdminProduct(): Promise<AdminProductAnalytics> {
  return fetchAdminResource<{ product: AdminProductAnalytics }>("/api/admin/product", "product");
}

export async function fetchAdminHealth(): Promise<AdminSystemHealth> {
  return fetchAdminResource<{ health: AdminSystemHealth }>("/api/admin/health", "health");
}

export async function fetchAdminActivity(): Promise<AdminActivityStats> {
  return fetchAdminResource<{ activity: AdminActivityStats }>("/api/admin/activity", "activity");
}

export async function fetchAdminSettings(): Promise<AdminSettingsInfo> {
  return fetchAdminResource<{ settings: AdminSettingsInfo }>("/api/admin/settings", "settings");
}

export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  profile: {
    current: ["profile", "current"] as const,
  },
  subjects: {
    all: ["subjects", "all"] as const,
    detail: (id: string) => ["subjects", "detail", id] as const,
  },
  tasks: {
    all: ["tasks"] as const,
    list: (filters: TaskListFilters) => ["tasks", "list", filters] as const,
    detail: (id: string) => ["tasks", "detail", id] as const,
  },
  dashboard: {
    all: ["dashboard"] as const,
    current: (tzOffset?: number) => ["dashboard", "current", tzOffset ?? "local"] as const,
  },
  calendar: {
    all: ["calendar"] as const,
    month: (year: number, month: number, tzOffset?: number) =>
      ["calendar", year, month, tzOffset ?? "local"] as const,
  },
  analytics: {
    all: ["analytics"] as const,
    current: (tzOffset?: number) => ["analytics", "current", tzOffset ?? "local"] as const,
  },
  admin: {
    all: ["admin"] as const,
    overview: ["admin", "overview"] as const,
    users: ["admin", "users"] as const,
    product: ["admin", "product"] as const,
    health: ["admin", "health"] as const,
    activity: ["admin", "activity"] as const,
    settings: ["admin", "settings"] as const,
  },
};
