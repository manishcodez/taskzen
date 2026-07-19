"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchAnalytics, queryKeys } from "@/lib/api-client";

export function useAnalytics(tzOffset?: number) {
  return useQuery({
    queryKey: queryKeys.analytics.current(tzOffset),
    queryFn: () => fetchAnalytics(tzOffset),
  });
}
