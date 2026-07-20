import { z } from "zod";

export const registerSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email address")
    .max(255, "Email must be 255 characters or fewer"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be 128 characters or fewer"),
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or fewer")
    .optional(),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email address")
    .max(255, "Email must be 255 characters or fewer"),
  password: z.string().min(1, "Password is required").max(128, "Password is too long"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

const newPasswordField = z
  .string()
  .min(8, "New password must be at least 8 characters")
  .max(128, "New password must be 128 characters or fewer");

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required").max(128, "Password is too long"),
    newPassword: newPasswordField,
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email address")
    .max(255, "Email must be 255 characters or fewer"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(1, "Reset token is required").max(512, "Reset token is invalid"),
    newPassword: newPasswordField,
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
