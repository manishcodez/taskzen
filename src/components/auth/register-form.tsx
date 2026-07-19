"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { TaskzenLogo } from "@/components/brand/taskzen-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authFieldClassName, PasswordInput } from "@/components/ui/password-input";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { registerRequest } from "@/lib/api-client";
import { fadeUp, staggerContainer } from "@/lib/motion";
import { registerSchema, type RegisterInput } from "@/lib/validators/auth";

export function RegisterForm() {
  const prefersReducedMotion = useReducedMotion();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: RegisterInput) {
    setFormError(null);

    try {
      await registerRequest(values);
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      const message =
        typeof error === "object" && error !== null && "message" in error
          ? String(error.message)
          : "Unable to create your account. Please try again.";
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
        <p className="label-caps text-accent">Get started</p>
        <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
          Build your{" "}
          <span className="text-gradient-brand">academic command center</span>
        </h2>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          Organize subjects, track deadlines, and monitor progress from day one with a workspace
          built for focused study sessions.
        </p>
        <div className="bg-panel-elevated max-w-sm p-5">
          <p className="label-caps text-primary">What you get</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>Subject-based task organization</li>
            <li>Calendar and deadline tracking</li>
            <li>Productivity analytics</li>
          </ul>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="bg-panel-elevated w-full overflow-hidden">
        <div className="border-b border-border/60 bg-gradient-to-r from-accent/10 via-primary/6 to-transparent px-6 py-5">
          <div className="mb-3 lg:hidden">
            <TaskzenLogo size="sm" />
          </div>
          <p className="label-caps text-accent">Create account</p>
          <h3 className="font-display mt-1 text-2xl font-semibold tracking-tight">Join Taskzen</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Start organizing subjects, tasks, and academic deadlines in one place.
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
              <Label htmlFor="name" className="label-caps normal-case tracking-[0.12em]">
                Name
              </Label>
              <Input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="Your name"
                aria-invalid={Boolean(errors.name)}
                className={authFieldClassName}
                {...register("name")}
              />
              {errors.name ? (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              ) : null}
            </div>

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
                autoComplete="new-password"
                placeholder="At least 8 characters"
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
              {isSubmitting ? "Creating account..." : "Create account"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Sign in
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
