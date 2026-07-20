"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { SafeUser } from "@/lib/auth/constants";
import {
  changePasswordRequest,
  fetchProfile,
  queryKeys,
  updateProfileRequest,
  uploadProfilePhotoRequest,
} from "@/lib/api-client";

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile.current,
    queryFn: fetchProfile,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfileRequest,
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.profile.current });
      const previous = queryClient.getQueryData<SafeUser>(queryKeys.profile.current);

      if (previous) {
        queryClient.setQueryData<SafeUser>(queryKeys.profile.current, {
          ...previous,
          name: input.name?.trim() || previous.name,
          course: input.course?.trim() || previous.course,
          college: input.college?.trim() || previous.college,
          semester: input.semester?.trim() || previous.semester,
          academicYear: input.academicYear?.trim() || previous.academicYear,
          emailDeadlineReminders:
            input.emailDeadlineReminders ?? previous.emailDeadlineReminders,
          emailOverdueNotifications:
            input.emailOverdueNotifications ?? previous.emailOverdueNotifications,
        });
      }

      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.profile.current, context.previous);
      }
    },
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.profile.current, user);
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
    },
  });
}

export function useUploadProfilePhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadProfilePhotoRequest,
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.profile.current, user);
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: changePasswordRequest,
  });
}
