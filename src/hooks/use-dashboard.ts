"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchDashboard, queryKeys } from "@/lib/api-client";

export function useDashboard(tzOffset?: number) {
  return useQuery({
    queryKey: queryKeys.dashboard.current(tzOffset),
    queryFn: () => fetchDashboard(tzOffset),
  });
}
