"use client";

import { useQuery } from "@tanstack/react-query";

import {
  fetchAdminActivity,
  fetchAdminHealth,
  fetchAdminOverview,
  fetchAdminProduct,
  fetchAdminSettings,
  fetchAdminUsers,
  queryKeys,
} from "@/lib/api-client";

export function useAdminOverview() {
  return useQuery({
    queryKey: queryKeys.admin.overview,
    queryFn: fetchAdminOverview,
  });
}

export function useAdminUsers() {
  return useQuery({
    queryKey: queryKeys.admin.users,
    queryFn: fetchAdminUsers,
  });
}

export function useAdminProduct() {
  return useQuery({
    queryKey: queryKeys.admin.product,
    queryFn: fetchAdminProduct,
  });
}

export function useAdminHealth() {
  return useQuery({
    queryKey: queryKeys.admin.health,
    queryFn: fetchAdminHealth,
  });
}

export function useAdminActivity() {
  return useQuery({
    queryKey: queryKeys.admin.activity,
    queryFn: fetchAdminActivity,
  });
}

export function useAdminSettings() {
  return useQuery({
    queryKey: queryKeys.admin.settings,
    queryFn: fetchAdminSettings,
  });
}
