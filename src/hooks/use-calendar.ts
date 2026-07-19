"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchCalendar, queryKeys } from "@/lib/api-client";

export function useCalendar(year: number, month: number, tzOffset?: number) {
  return useQuery({
    queryKey: queryKeys.calendar.month(year, month, tzOffset),
    queryFn: () => fetchCalendar(year, month, tzOffset),
    placeholderData: (previous) => previous,
  });
}
