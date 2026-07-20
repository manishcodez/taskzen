"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { TaskzenLogo } from "@/components/brand/taskzen-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authFieldClassName } from "@/components/ui/password-input";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { forgotPasswordRequest } from "@/lib/api-client";
import { fadeUp, staggerContainer } from "@/lib/motion";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validators/auth";

export function ForgotPasswordForm() {
  const prefersReducedMotion = useReducedMotion();
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: ForgotPasswordInput) {
    setFormError(null);
    setSuccessMessage(null);

    try {
      const message = await forgotPasswordRequest(values);
      setSuccessMessage(message);
    } catch (error) {
      const message =
        typeof error === "object" && error !== null && "message" in error
          ? String(error.message)
          : "Unable to process your request. Please try again.";
      setFormError(message);
    }
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
        <p className="label-caps text-accent">Account recovery</p>
        <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
          Regain access with a{" "}
          <span className="text-gradient-brand">secure reset link</span>
        </h2>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          Enter the email for your Taskzen account. If it matches an account, we will send a
          one-time reset link that expires soon.
        </p>
      </motion.div>

      <motion.div variants={fadeUp} className="bg-panel-elevated w-full overflow-hidden">
        <div className="border-b border-border/60 bg-gradient-to-r from-primary/10 via-accent/6 to-transparent px-6 py-5">
          <div className="mb-3 lg:hidden">
            <TaskzenLogo size="sm" />
          </div>
          <p className="label-caps text-primary">Forgot password</p>
          <h3 className="font-display mt-1 text-2xl font-semibold tracking-tight">
            Reset your password
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            We will email a secure link if an account exists for that address.
          </p>
        </div>

        {successMessage ? (
          <div className="space-y-4 px-6 py-5">
            <div className="rounded-xl border border-primary/25 bg-primary/8 px-3 py-2.5 text-sm text-foreground">
              {successMessage}
            </div>
            <p className="text-sm text-muted-foreground">
              Check your inbox and spam folder. The link can be used once and expires shortly.
            </p>
            <Link
              href="/login"
              className="inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4 px-6 py-5">
              {formError ? (
                <div className="rounded-xl border border-destructive/25 bg-destructive/8 px-3 py-2.5 text-sm text-destructive">
                  {formError}
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="email" className="label-caps normal-case tracking-[0.12em]">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@university.edu"
                  aria-invalid={Boolean(errors.email)}
                  className={authFieldClassName}
                  {...register("email")}
                />
                {errors.email ? (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                ) : null}
              </div>
            </div>
            <div className="flex flex-col gap-4 border-t border-border/60 px-6 py-5">
              <Button type="submit" className="w-full shadow-soft" size="lg" disabled={isSubmitting}>
                {isSubmitting ? "Sending link..." : "Send reset link"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Remembered your password?{" "}
                <Link
                  href="/login"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
}
