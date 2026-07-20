"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { TaskzenLogo } from "@/components/brand/taskzen-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authFieldClassName, PasswordInput } from "@/components/ui/password-input";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { loginRequest } from "@/lib/api-client";
import { getSafeRedirectPath } from "@/lib/auth/safe-redirect";
import { fadeUp, staggerContainer } from "@/lib/motion";
import { loginSchema, type LoginInput } from "@/lib/validators/auth";

export function LoginForm() {
  const prefersReducedMotion = useReducedMotion();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginInput) {
    setFormError(null);

    try {
      await loginRequest(values);
      const redirectTo = getSafeRedirectPath(searchParams.get("redirect"));
      router.push(redirectTo);
      router.refresh();
    } catch (error) {
      const message =
        typeof error === "object" && error !== null && "message" in error
          ? String(error.message)
          : "Unable to sign in. Please try again.";
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
        <p className="label-caps text-accent">Welcome back</p>
        <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
          Return to your{" "}
          <span className="text-gradient-brand">academic atelier</span>
        </h2>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          Pick up where you left off with deadlines, subjects, and progress tracking in one
          focused workspace.
        </p>
        <div className="bg-panel-elevated max-w-sm p-5">
          <p className="label-caps text-primary">Today&apos;s focus</p>
          <p className="mt-2 font-display text-lg font-semibold text-foreground">
            Deadlines, subjects, and calm progress.
          </p>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="bg-panel-elevated w-full overflow-hidden">
        <div className="border-b border-border/60 bg-gradient-to-r from-primary/10 via-accent/6 to-transparent px-6 py-5">
          <div className="mb-3 lg:hidden">
            <TaskzenLogo size="sm" />
          </div>
          <p className="label-caps text-primary">Sign in</p>
          <h3 className="font-display mt-1 text-2xl font-semibold tracking-tight">Welcome back</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Access your academic workspace and stay on top of deadlines.
          </p>
        </div>
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

            <div className="space-y-2">
              <Label htmlFor="password" className="label-caps normal-case tracking-[0.12em]">
                Password
              </Label>
              <PasswordInput
                id="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                aria-invalid={Boolean(errors.password)}
                {...register("password")}
              />
              {errors.password ? (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-col gap-4 border-t border-border/60 px-6 py-5">
            <Button type="submit" className="w-full shadow-soft" size="lg" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Create one
              </Link>
            </p>
            <p className="text-center text-sm text-muted-foreground">
              <Link href="/" className="font-medium text-foreground underline-offset-4 hover:underline">
                Back to home page
              </Link>
            </p>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
