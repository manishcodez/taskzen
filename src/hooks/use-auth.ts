"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchCurrentUser, queryKeys } from "@/lib/api-client";

export function useAuth() {
  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: fetchCurrentUser,
    retry: false,
    staleTime: 5 * 60_000,
  });
}
