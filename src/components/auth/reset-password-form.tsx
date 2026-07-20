"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { TaskzenLogo } from "@/components/brand/taskzen-logo";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { resetPasswordRequest } from "@/lib/api-client";
import { fadeUp, staggerContainer } from "@/lib/motion";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validators/auth";

export function ResetPasswordForm() {
  const prefersReducedMotion = useReducedMotion();
  const searchParams = useSearchParams();
  const tokenFromQuery = useMemo(() => searchParams.get("token")?.trim() ?? "", [searchParams]);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: tokenFromQuery,
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    setValue("token", tokenFromQuery);
  }, [setValue, tokenFromQuery]);

  async function onSubmit(values: ResetPasswordInput) {
    setFormError(null);
    setSuccessMessage(null);

    try {
      const message = await resetPasswordRequest({
        token: values.token || tokenFromQuery,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });
      setSuccessMessage(message);
    } catch (error) {
      const message =
        typeof error === "object" && error !== null && "message" in error
          ? String(error.message)
          : "Unable to reset your password. Please try again.";
      setFormError(message);
    }
  }

  if (!tokenFromQuery) {
    return (
      <motion.div
        initial={prefersReducedMotion ? false : "hidden"}
        animate="show"
        variants={staggerContainer(0.08, 0.04)}
        className="w-full max-w-lg"
      >
        <motion.div variants={fadeUp} className="bg-panel-elevated overflow-hidden">
          <div className="border-b border-border/60 bg-gradient-to-r from-primary/10 via-accent/6 to-transparent px-6 py-5">
            <TaskzenLogo size="sm" />
            <p className="label-caps mt-3 text-primary">Reset password</p>
            <h3 className="font-display mt-1 text-2xl font-semibold tracking-tight">
              Missing reset link
            </h3>
          </div>
          <div className="space-y-4 px-6 py-5">
            <p className="text-sm text-muted-foreground">
              This page needs a valid reset link from your email. Request a new one to continue.
            </p>
            <Link
              href="/forgot-password"
              className="inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Request a new reset link
            </Link>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={prefersReducedMotion ? false : "hidden"}
      animate="show"
      variants={staggerContainer(0.08, 0.04)}
      className="grid w-full max-w-4xl gap-8 lg:grid-cols-[1fr_420px] lg:items-center"
    >
      <motion.div variants={fadeUp} className="hidden space-y-5 lg:block">
        <TaskzenLogo size="lg" />
        <p className="label-caps text-accent">Choose a new password</p>
        <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
          Secure your{" "}
          <span className="text-gradient-brand">Taskzen workspace</span>
        </h2>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          Pick a strong password you have not used here before. After saving, sign in with the new
          password.
        </p>
      </motion.div>

      <motion.div variants={fadeUp} className="bg-panel-elevated w-full overflow-hidden">
        <div className="border-b border-border/60 bg-gradient-to-r from-primary/10 via-accent/6 to-transparent px-6 py-5">
          <div className="mb-3 lg:hidden">
            <TaskzenLogo size="sm" />
          </div>
          <p className="label-caps text-primary">Reset password</p>
          <h3 className="font-display mt-1 text-2xl font-semibold tracking-tight">
            Create a new password
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Use at least 8 characters. Confirm it below before saving.
          </p>
        </div>

        {successMessage ? (
          <div className="space-y-4 px-6 py-5">
            <div className="rounded-xl border border-primary/25 bg-primary/8 px-3 py-2.5 text-sm text-foreground">
              {successMessage}
            </div>
            <Link
              href="/login"
              className="inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Continue to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <input type="hidden" {...register("token")} />
            <div className="space-y-4 px-6 py-5">
              {formError ? (
                <div className="rounded-xl border border-destructive/25 bg-destructive/8 px-3 py-2.5 text-sm text-destructive">
                  {formError}
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="label-caps normal-case tracking-[0.12em]">
                  New password
                </Label>
                <PasswordInput
                  id="newPassword"
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  aria-invalid={Boolean(errors.newPassword)}
                  {...register("newPassword")}
                />
                {errors.newPassword ? (
                  <p className="text-sm text-destructive">{errors.newPassword.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="label-caps normal-case tracking-[0.12em]"
                >
                  Confirm password
                </Label>
                <PasswordInput
                  id="confirmPassword"
                  autoComplete="new-password"
                  placeholder="Re-enter your new password"
                  aria-invalid={Boolean(errors.confirmPassword)}
                  {...register("confirmPassword")}
                />
                {errors.confirmPassword ? (
                  <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                ) : null}
              </div>
            </div>
            <div className="flex flex-col gap-4 border-t border-border/60 px-6 py-5">
              <Button type="submit" className="w-full shadow-soft" size="lg" disabled={isSubmitting}>
                {isSubmitting ? "Updating password..." : "Update password"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                <Link
                  href="/login"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Back to sign in
                </Link>
              </p>
            </div>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
}
