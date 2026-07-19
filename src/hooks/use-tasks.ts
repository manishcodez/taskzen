"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  completeTaskRequest,
  createTaskRequest,
  deleteTaskRequest,
  fetchTask,
  fetchTasks,
  queryKeys,
  reopenTaskRequest,
  updateTaskRequest,
} from "@/lib/api-client";
import type { TaskListFilters } from "@/types";

function invalidateTaskSideEffects(
  queryClient: ReturnType<typeof useQueryClient>,
  subjectId?: string,
) {
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.calendar.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.subjects.all });

  if (subjectId) {
    queryClient.invalidateQueries({ queryKey: queryKeys.subjects.detail(subjectId) });
  }
}

function invalidateTaskRelatedQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  subjectId?: string,
) {
  queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.subjects.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.calendar.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });

  if (subjectId) {
    queryClient.invalidateQueries({ queryKey: queryKeys.subjects.detail(subjectId) });
  }
}

export function useTasks(filters: TaskListFilters) {
  return useQuery({
    queryKey: queryKeys.tasks.list(filters),
    queryFn: ({ signal }) => fetchTasks(filters, signal),
    placeholderData: (previous) => previous,
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: queryKeys.tasks.detail(id),
    queryFn: () => fetchTask(id),
    enabled: Boolean(id),
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTaskRequest,
    onSuccess: (task) => {
      invalidateTaskRelatedQueries(queryClient, task.subjectId);
    },
  });
}

export function useUpdateTask(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Parameters<typeof updateTaskRequest>[1]) =>
      updateTaskRequest(id, input),
    onSuccess: (task) => {
      queryClient.setQueryData(queryKeys.tasks.detail(id), task);
      invalidateTaskRelatedQueries(queryClient, task.subjectId);
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTaskRequest,
    onSuccess: () => {
      invalidateTaskRelatedQueries(queryClient);
    },
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: completeTaskRequest,
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.all });

      const previousLists = queryClient.getQueriesData({ queryKey: queryKeys.tasks.all });

      queryClient.setQueriesData<{ items: Array<{ id: string; status: string; completedAt: string | null; isOverdue: boolean }> }>(
        { queryKey: queryKeys.tasks.all },
        (old) => {
          if (!old) return old;

          return {
            ...old,
            items: old.items.map((task) =>
              task.id === taskId
                ? {
                    ...task,
                    status: "COMPLETED",
                    completedAt: new Date().toISOString(),
                    isOverdue: false,
                  }
                : task,
            ),
          };
        },
      );

      return { previousLists };
    },
    onError: (_error, _taskId, context) => {
      context?.previousLists.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSuccess: (task) => {
      queryClient.setQueryData(queryKeys.tasks.detail(task.id), task);
      invalidateTaskSideEffects(queryClient, task.subjectId);
    },
  });
}

export function useReopenTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reopenTaskRequest,
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.all });

      const previousLists = queryClient.getQueriesData({ queryKey: queryKeys.tasks.all });

      queryClient.setQueriesData<{ items: Array<{ id: string; status: string; completedAt: string | null; isOverdue: boolean; dueDate?: string | null }> }>(
        { queryKey: queryKeys.tasks.all },
        (old) => {
          if (!old) return old;

          return {
            ...old,
            items: old.items.map((task) =>
              task.id === taskId
                ? {
                    ...task,
                    status: "NOT_STARTED",
                    completedAt: null,
                    isOverdue: task.dueDate
                      ? new Date(task.dueDate).getTime() < Date.now()
                      : false,
                  }
                : task,
            ),
          };
        },
      );

      return { previousLists };
    },
    onError: (_error, _taskId, context) => {
      context?.previousLists.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSuccess: (task) => {
      queryClient.setQueryData(queryKeys.tasks.detail(task.id), task);
      invalidateTaskSideEffects(queryClient, task.subjectId);
    },
  });
}
