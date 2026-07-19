"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createSubjectRequest,
  deleteSubjectRequest,
  fetchSubject,
  fetchSubjects,
  queryKeys,
  updateSubjectRequest,
} from "@/lib/api-client";

export function useSubjects() {
  return useQuery({
    queryKey: queryKeys.subjects.all,
    queryFn: fetchSubjects,
  });
}

export function useSubject(id: string) {
  return useQuery({
    queryKey: queryKeys.subjects.detail(id),
    queryFn: () => fetchSubject(id),
    enabled: Boolean(id),
  });
}

export function useCreateSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSubjectRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects.all });
    },
  });
}

export function useUpdateSubject(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      name?: string;
      code?: string;
      color?: string;
      description?: string;
    }) => updateSubjectRequest(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects.detail(id) });
    },
  });
}

export function useDeleteSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSubjectRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects.all });
    },
  });
}
